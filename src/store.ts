import type { Event } from './event';
import { createEvent } from './event';
import type { Effect } from './effect';
import type { Unsubscribe } from './types.h';

type Unit<T> = Event<T> | Store<T> | Effect<T, unknown>;

export interface Store<State> {
  map<LastState>(fn: (state: State, lastState?: LastState) => LastState): Store<LastState>;
  on<Payload>(
    trigger: Unit<Payload> | Array<Unit<Payload>>,
    reducer: (state: State, data: Payload) => State
  ): Store<State>;
  watch(watcher: (state: State) => void): Unsubscribe;
  watch<Payload>(trigger: Unit<Payload>, fn: (state: State, payload: Payload) => void): Unsubscribe;
  off<Payload>(trigger: Unit<Payload>): void;

  getState(): State;
}

export function createStore<State>(defaultState: State): Store<State> {
  const watchers: Set<(state: State) => void> = new Set<(state: State) => void>();
  const subscribers: Map<Unit<unknown>, () => void> = new Map();

  let state = defaultState;

  function update(newState: State): void {
    if (newState === undefined || newState === state) return;

    state = newState;
    watchers.forEach((watcher) => watcher(state));
  }

  const store = {
    getState: (): State => state,
    on<Payload>(
      trigger: Unit<Payload> | Array<Unit<Payload>>,
      reducer: (state: State, data: Payload) => State
    ): Store<State> {
      (Array.isArray(trigger) ? trigger : [trigger]).forEach((clock) => {
        store.off(clock);
        subscribers.set(
          clock as Unit<unknown>,
          clock.watch((payload: Payload) => update(reducer(state, payload)))
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
      triggerOrWatcher: Unit<Payload> | ((state: State) => void),
      fn?: (state: State, payload: Payload) => void
    ): Unsubscribe {
      const argumentsSize = arguments.length;
      const isWatcher = (_: unknown): _ is (state: State) => void => argumentsSize === 1;

      if (isWatcher(triggerOrWatcher)) {
        watchers.add(triggerOrWatcher);

        return () => watchers.delete(triggerOrWatcher);
      }

      return triggerOrWatcher.watch((data: Payload) => fn && fn(store.getState(), data));
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
  };

  return store;
}
