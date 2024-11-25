import type { Effect } from "./effect";
import { createEvent, type Event } from "./event";
import type { Unsubscribe } from "./types.h";

type Unit<T> = Effect<T, unknown> | Event<T> | Store<T>;

export interface Store<State> {
  map<NewState>(fn: (state: State, lastState?: NewState) => NewState): Store<NewState>;

  on<Payload>(
    trigger: Unit<Payload> | Unit<Payload>[],
    reducer: (state: State, payload: Payload) => State,
  ): Store<State>;

  watch(watcher: (state: State) => void): Unsubscribe;

  watch<Payload>(trigger: Unit<Payload>, fn: (state: State, payload: Payload) => void): Unsubscribe;

  off<Payload>(trigger: Unit<Payload>): void;

  reset<Payload>(...triggers: Unit<Payload>[]): Store<State>;

  getState(): State;
}

export function createStore<State>(defaultState: State): Store<State> {
  const watchers: Set<(state: State) => void> = new Set();
  const subscribers: Map<Unit<unknown>, () => void> = new Map();
  const initialState = { ...{ defaultState } };

  let state = defaultState;

  function update(newState: State): void {
    if (newState === undefined || newState === state) return;

    state = newState;
    watchers.forEach((watcher) => watcher(state));
  }

  const $store = {
    getState: (): State => state,
    on<Payload>(
      trigger: Unit<Payload> | Unit<Payload>[],
      reducer: (state: State, payload: Payload) => State,
    ): Store<State> {
      (Array.isArray(trigger) ? trigger : [trigger]).forEach((clock) => {
        $store.off(clock);
        subscribers.set(
          clock as Unit<unknown>,
          clock.watch((payload: Payload) => update(reducer(state, payload))),
        );
      });

      return $store;
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
      fn?: (state: State, payload: Payload) => void,
    ): Unsubscribe {
      const argumentsSize = arguments.length;
      const isUnit = (_: unknown): _ is Unit<Payload> => argumentsSize === 2;

      if (isUnit(triggerOrWatcher)) {
        return triggerOrWatcher.watch((payload: Payload) => fn && fn($store.getState(), payload));
      }

      watchers.add(triggerOrWatcher);

      triggerOrWatcher($store.getState());

      return () => watchers.delete(triggerOrWatcher);
    },
    map<NewState>(fn: (state: State, lastState?: NewState) => NewState): Store<NewState> {
      const lastResult = fn($store.getState());
      const updateStore = createEvent<NewState>();
      const $newStore = createStore<NewState>(lastResult).on(updateStore, (_, newState) => newState);

      $store.watch((s: State) => {
        const lastState = $newStore.getState();
        const newState = fn(s, lastState);

        if (newState !== undefined && newState !== lastState) {
          updateStore(newState);
        }
      });

      return $newStore as Store<NewState>;
    },
    reset<Payload>(...triggers: Unit<Payload>[]): Store<State> {
      triggers.forEach((trigger) => {
        $store.on(trigger, () => initialState.defaultState);
      });

      return $store;
    },
  };

  return $store;
}
