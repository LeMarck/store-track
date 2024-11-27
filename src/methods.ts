import { createEvent, type Event } from "./event";
import { createStore, type Store } from "./store";
import type { Unit } from "./types.h";

type States<S extends Store<unknown>[]> = {
  [Key in keyof S]: S[Key] extends Store<infer U> ? U : never;
};

type CombineFn<S extends Store<unknown>[], NewStore> = (...states: States<S>) => NewStore;

export function combine<S extends Store<unknown>[], NewStore>(
  ...args: [...S, CombineFn<S, NewStore>]
): Store<NewStore> {
  const stores = args.slice(0, -1) as S;
  const fn = args[args.length - 1] as CombineFn<S, NewStore>;

  const getStoreState = () => fn(...(stores.map((store) => store.getState()) as States<S>));

  const updateStore = createEvent();
  const newStore = createStore<NewStore>(getStoreState()).on(updateStore, () => getStoreState());

  stores.forEach((store) => store.watch(() => updateStore()));

  return newStore;
}

export function merge<State>(...units: Unit<State>[]): Event<State> {
  const event = createEvent<State>();

  units.forEach((unit) => unit.watch(event));

  return event;
}

export function createApi<State, Api extends { [name: string]: (store: State, payload: never) => State }>(
  store: Store<State>,
  api: Api,
) {
  const reducers = Object.entries(api) as [keyof Api, (store: State, payload: never) => State][];
  const result = {} as {
    [K in keyof Api]: ((store: State, payload: void) => State) extends Api[K]
      ? Event
      : Api[K] extends (store: State) => State
        ? Event
        : Api[K] extends (store: State, payload: infer Payload) => State
          ? Event<Payload extends void ? Exclude<Payload, undefined> : Payload>
          : never;
  };

  for (const [key, reducer] of reducers) {
    result[key] = createEvent() as never;
    store.on(result[key], reducer);
  }

  return result;
}
