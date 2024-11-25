import { createStore } from "./store";
import { combine } from "./utils";

describe("utils", () => {
  it("should be create combine store", () => {
    const $balance = createStore(0);
    const $username = createStore("zerobias");
    const mockLogData = jest.fn();

    const $greeting = combine(
      $balance,
      $username,
      (balance, username) => `Hello, ${username}. Your balance is ${balance}`,
    );

    $greeting.watch(mockLogData);
    expect(mockLogData).toHaveBeenCalledWith("Hello, zerobias. Your balance is 0");
  });
});
