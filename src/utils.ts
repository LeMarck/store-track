import { createEvent } from "./event";
import { createStore, type Store } from "./store";

type States<S extends Store<unknown>[]> = {
  [Key in keyof S]: S[Key] extends Store<infer U> ? U : never;
};

type CombineFn<S extends Store<unknown>[], D> = (...states: States<S>) => D;

export function combine<S extends Store<unknown>[], D>(...args: [...S, CombineFn<S, D>]): Store<D> {
  const stores = args.slice(0, -1) as S;
  const fn = args[args.length - 1] as CombineFn<S, D>;

  const getStoreState = () => fn(...(stores.map((store) => store.getState()) as States<S>));

  const updateStore = createEvent();
  const newStore = createStore<D>(getStoreState()).on(updateStore, () => getStoreState());

  stores.forEach((store) => store.watch(() => updateStore()));

  return newStore;
}
