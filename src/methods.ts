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

export function merge<T>(...units: Unit<T>[]): Event<T> {
  const event = createEvent<T>();

  units.forEach((unit) => unit.watch(event));

  return event;
}
