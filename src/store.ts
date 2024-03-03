import type { Event } from './event';
import { createEvent } from './event';
import type { Effect } from './effect';
import type { Unsubscribe } from './types.h';

type Unit<T = any> = Event<T> | Store<T> | Effect<T, unknown>;

export interface Store<State> {
  map<LastState>(fn: (state: State, lastState?: LastState) => LastState): Store<LastState>;
  on<Payload>(
    trigger: Unit<Payload> | Array<Unit<Payload>>,
    reducer: (state: State, payload: Payload) => State
  ): Store<State>;
  watch<Payload>(watcher: (state: State, payload: Payload) => void): Unsubscribe;
  watch<Payload>(trigger: Unit<Payload>, fn: (state: State, payload: Payload) => void): Unsubscribe;
  off<Payload>(trigger: Unit<Payload>): void;
  reset(...triggers: Array<Unit> | [Array<Unit>]): Store<State>;

  getState(): State;
}

export function createStore<State>(defaultState: State): Store<State> {
  const watchers: Set<(state: State, payload: any) => void> = new Set();
  const subscribers: Map<Unit<unknown>, () => void> = new Map();
  const initialState = { ...{ defaultState } };

  let state = defaultState;

  function update<Payload>(newState: State, payload: Payload): void {
    state = newState;
    watchers.forEach((watcher) => watcher(state, payload));
  }

  const store = {
    getState: (): State => state,
    on<Payload>(
      trigger: Unit<Payload> | Array<Unit<Payload>>,
      reducer: (state: State, payload: Payload) => State
    ): Store<State> {
      (Array.isArray(trigger) ? trigger : [trigger]).forEach((clock) => {
        store.off(clock);
        subscribers.set(
          clock as Unit<unknown>,
          clock.watch((payload: Payload) => update(reducer(state, payload), payload))
        );
      });

      return store;
    },
    off<Payload>(trigger: Unit<Payload>): void {
      const subscriber = subscribers.get(trigger as Unit<unknown>);

      if (subscriber) {
        subscriber();
        subscribers.delete(trigger as Unit<unknown>);
      }
    },
    watch<Payload>(
      triggerOrWatcher: Unit<Payload> | ((state: State, payload: Payload) => void),
      fn?: (state: State, payload: Payload) => void
    ): Unsubscribe {
      const argumentsSize = arguments.length;
      const isUnit = (_: unknown): _ is Unit<Payload> => argumentsSize === 2;

      if (isUnit(triggerOrWatcher)) {
        return triggerOrWatcher.watch((payload: Payload) => fn && fn(store.getState(), payload));
      }

      watchers.add(triggerOrWatcher);

      return () => watchers.delete(triggerOrWatcher);
    },
    map<LastState>(fn: (state: State, lastState?: LastState) => LastState): Store<LastState> {
      const updateStore = createEvent<LastState>();
      const newStore = createStore<LastState | undefined>(undefined).on(updateStore, (_, newState) => newState);

      store.watch((s: State) => {
        const lastState = newStore.getState();
        const newState = fn(s, lastState);

        if (newState !== undefined && newState !== lastState) {
          updateStore(newState);
        }
      });

      return newStore as Store<LastState>;
    },
    reset(...triggers: Array<Unit> | [Array<Unit>]): Store<State> {
      triggers.forEach((trigger) => {
        store.on(trigger, () => initialState.defaultState);
      });

      return store;
    },
  };

  return store;
}
