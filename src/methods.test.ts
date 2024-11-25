import { createStore } from "./store";
import { combine, merge } from "./methods";
import { createEvent } from "./event";

describe("methods", () => {
  it("should be create combine store", () => {
    const $balance = createStore(0);
    const $username = createStore("zerobias");
    const watcherMock = jest.fn();

    const $greeting = combine(
      $balance,
      $username,
      (balance, username) => `Hello, ${username}. Your balance is ${balance}`,
    );

    $greeting.watch(watcherMock);
    expect(watcherMock).toHaveBeenCalledWith("Hello, zerobias. Your balance is 0");
  });

  it("should be create new event that triggers upon any of the given units being triggered", () => {
    const watcherMock = jest.fn();
    const foo = createEvent<number>();
    const bar = createEvent<number>();
    const baz = merge(foo, bar);

    baz.watch(watcherMock);

    foo(10);
    expect(watcherMock).toHaveBeenCalledWith(10);

    baz(42);
    expect(watcherMock).toHaveBeenCalledWith(42);
  });
});
