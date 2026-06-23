import { expect, test, vi } from "vitest";

import { createStore } from "./store";
import { combine, createApi, merge } from "./methods";
import { createEvent } from "./event";

test("`combine`: метод позволяет получить состояние из каждого переданного стора и комбинировать их в одно значение, сохраняя в новом производном сторе", () => {
  const $balance = createStore(0);
  const $username = createStore("zerobias");
  const watcherMock = vi.fn();

  const $greeting = combine(
    $balance,
    $username,
    (balance, username) => `Hello, ${username}. Your balance is ${balance}`,
  );

  $greeting.watch(watcherMock);
  expect(watcherMock).toHaveBeenCalledWith("Hello, zerobias. Your balance is 0");
});

test("`merge`: объединяет апдейты массива юнитов в новое событие, которое будет срабатывать при запуске любой из переданных сущностей", () => {
  const watcherMock = vi.fn();
  const foo = createEvent<number>();
  const bar = createEvent<number>();
  const baz = merge(foo, bar);

  baz.watch(watcherMock);

  foo(10);
  expect(watcherMock).toHaveBeenCalledWith(10);

  baz(42);
  expect(watcherMock).toHaveBeenCalledWith(42);
});

test("`createApi`: способ массового создания событий для обновления стора на основе объекта с функциями-обработчиками", () => {
  const incrementMock = vi.fn();
  const addMock = vi.fn((store: number, payload: number): number => store + payload);
  const $store = createStore(0);

  const { increment, add } = createApi($store, {
    increment: incrementMock,
    add: addMock,
  });

  increment();
  expect(incrementMock).toHaveBeenCalled();

  add(10);
  expect(addMock).toHaveBeenCalledWith(0, 10);
});
