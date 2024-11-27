import type { Unsubscribe } from "./types.h";

export interface Event<Payload = void> {
  (payload: Payload): void;

  watch(watcher: (payload: Payload) => void): Unsubscribe;

  map<NewPayload>(fn: (payload: Payload) => NewPayload): Event<NewPayload>;

  prepend<NewPayload>(fn: (payload: NewPayload) => Payload): Event<NewPayload>;

  filterMap<NewPayload>(fn: (payload: Payload) => NewPayload | void): Event<NewPayload>;

  filter(config: { fn: (payload: Payload) => boolean }): Event<Payload>;
}

export function createEvent<Payload = void>(): Event<Payload> {
  const watchers: Set<(payload: Payload) => void> = new Set();

  function action(payload: Payload): void {
    watchers.forEach((subscriber) => subscriber(payload));
  }

  action.watch = (watcher: (payload: Payload) => void): Unsubscribe => {
    watchers.add(watcher);

    return () => watchers.delete(watcher);
  };

  action.map = <NewPayload>(fn: (payload: Payload) => NewPayload): Event<NewPayload> => {
    const event = createEvent<NewPayload>();

    action.watch((payload) => event(fn(payload)));

    return event;
  };

  action.prepend = <NewPayload>(fn: (payload: NewPayload) => Payload): Event<NewPayload> => {
    const event = createEvent<NewPayload>();

    event.watch((payload) => action(fn(payload)));

    return event;
  };

  action.filterMap = <NewPayload>(
    fn: (payload: Payload) => NewPayload | void,
  ): Event<NewPayload> => {
    const event = createEvent<NewPayload>();

    action.watch((payload) => {
      const nextPayload = fn(payload);

      if (nextPayload !== undefined) {
        event(nextPayload as NewPayload);
      }
    });

    return event;
  };

  action.filter = (config: { fn: (payload: Payload) => boolean }): Event<Payload> => {
    const event = createEvent<Payload>();

    action.watch((payload) => {
      if (config.fn(payload)) {
        event(payload);
      }
    });

    return event;
  };

  return action;
}
