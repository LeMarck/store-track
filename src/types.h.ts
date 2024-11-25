import type { Effect } from "./effect";
import type { Event } from "./event";
import type { Store } from "./store";

export type Unsubscribe = () => void;

export type Unit<T> = Effect<T, unknown> | Event<T> | Store<T>;
