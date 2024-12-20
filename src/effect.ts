import { createEvent, type Event } from "./event";
import { createStore, type Store } from "./store";
import type { Unsubscribe } from "./types.h";

type EffectFinally<Params, Done, Fail = Error> =
  | { status: "done"; params: Params; result: Done }
  | { status: "fail"; params: Params; error: Fail };

export interface Effect<Params, Done, Fail = Error> {
  (params: Params): Promise<Done>;

  readonly done: Event<{ params: Params; result: Done }>;
  readonly doneData: Event<Done>;
  readonly fail: Event<{ params: Params; error: Fail }>;
  readonly failData: Event<Fail>;
  readonly finally: Event<EffectFinally<Params, Done, Fail>>;
  readonly pending: Store<boolean>;
  readonly use: {
    (handler: (params: Params) => Promise<Done> | Done): Effect<Params, Done, Fail>;
    getCurrent(): (params: Params) => Promise<Done> | Done;
  };

  watch(watcher: (params: Params) => void): Unsubscribe;

  map<Payload>(fn: (params: Params) => Payload): Event<Payload>;

  prepend<Payload>(fn: (payload: Payload) => Params): Event<Payload>;
}

const defaultHandler = () => {
  throw new Error("No handler used in effect");
};

export function createEffect<Params, Done, Fail = Error>(
  handler: (params: Params) => Promise<Done> | Done = defaultHandler,
): Effect<Params, Done, Fail> {
  const watchers: Set<(params: Params) => void> = new Set();
  const finallyEvent = createEvent<EffectFinally<Params, Done, Fail>>();
  const doneEvent = finallyEvent.filterMap<{ params: Params; result: Done }>((data) =>
    data.status === "done" ? { params: data.params, result: data.result } : undefined,
  );
  const failEvent = finallyEvent.filterMap<{ params: Params; error: Fail }>((data) =>
    data.status === "fail" ? { params: data.params, error: data.error } : undefined,
  );
  const updatePendingState = createEvent<boolean>();
  const $pendingStore = createStore(false).on(updatePendingState, (_, isPending) => isPending);

  let currentHandler = handler;

  async function effect(params: Params): Promise<Done> {
    watchers.forEach((subscriber) => subscriber(params));

    updatePendingState(true);

    try {
      const result = await currentHandler(params);

      finallyEvent({ status: "done", params, result });
      updatePendingState(false);

      return result;
    } catch (error: unknown) {
      finallyEvent({ status: "fail", params, error: error as Fail });
      updatePendingState(false);

      throw error;
    }
  }

  function use(handler: (params: Params) => Promise<Done> | Done): Effect<Params, Done, Fail> {
    currentHandler = handler;

    return effect;
  }

  use.getCurrent = () => currentHandler;

  effect.done = doneEvent;
  effect.doneData = doneEvent.map(({ result }) => result);
  effect.fail = failEvent;
  effect.failData = failEvent.map(({ error }) => error);
  effect.finally = finallyEvent;
  effect.pending = $pendingStore;
  effect.use = use;

  effect.watch = (watcher: (params: Params) => void): Unsubscribe => {
    watchers.add(watcher);

    return () => watchers.delete(watcher);
  };

  effect.map = <Payload>(fn: (params: Params) => Payload): Event<Payload> => {
    const event = createEvent<Payload>();

    effect.watch((params) => event(fn(params)));

    return event;
  };

  effect.prepend = <Payload>(fn: (params: Payload) => Params): Event<Payload> => {
    const event = createEvent<Payload>();

    event.watch((payload) => effect(fn(payload)));

    return event;
  };

  return effect;
}
