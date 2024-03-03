import { createStore } from './store';
import { createEvent } from './event';

describe('createStore', () => {
  it('should be defined Store', () => {
    const $store = createStore(42);

    expect($store).toBeDefined();
    expect($store.getState()).toBe(42);
  });

  it('`.on`: обновляет состояние стора с помощью функции-обработчика при срабатывании триггера', () => {
    const eventMock = jest.fn(<T>() => createEvent<T>())();
    const reducerMock = jest.fn(() => 1);
    const $store = createStore(0).on([eventMock], reducerMock);

    expect($store.getState()).toBe(0);

    eventMock(10);

    expect(reducerMock).toHaveBeenCalledWith(0, 10);
    expect($store.getState()).toBe(1);
  });

  it('`.watch`: вызывает функцию с сайд-эффектами при каждом обновлении стора', () => {
    const watcherMock = jest.fn();
    const add = createEvent<number>();
    const foo = createEvent<number>();
    const $store = createStore(0).on(add, (state, payload) => state + payload);

    $store.watch(watcherMock);
    $store.watch(foo, watcherMock);

    add(4);
    expect(watcherMock).toHaveBeenCalledWith(4, 4);
    expect($store.getState()).toBe(4);

    add(3);
    expect(watcherMock).toHaveBeenCalledWith(7, 3);
    expect($store.getState()).toBe(7);

    foo(42);
    expect(watcherMock).toHaveBeenCalledWith(7, 42);
    expect($store.getState()).toBe(7);
  });

  it('`unwatch` прекращает отслеживание', () => {
    const watcherMock = jest.fn();
    const add = createEvent<number>();
    const $store = createStore(0).on(add, (state, payload) => state + payload);

    const unwatch = $store.watch(watcherMock);

    add(42);
    expect(watcherMock).toHaveBeenCalledWith(42, 42);

    unwatch();
    add(123);
    add(456);
    expect(watcherMock).toHaveBeenCalledTimes(1);
  });

  it('`.map`: создает производный стор на основе данных из исходного', () => {
    const watcherMock = jest.fn();
    const changed = createEvent<string>();
    const $title = createStore('').on(changed, (_, newTitle) => newTitle);

    $title.map((title) => title.length).watch(watcherMock);

    changed('hello');
    expect(watcherMock).toHaveBeenCalledWith(5, 5);
    expect(watcherMock).toHaveBeenCalledTimes(1);

    changed('world');
    expect(watcherMock).toHaveBeenCalledTimes(1);

    changed('hello world');
    expect(watcherMock).toHaveBeenCalledWith(11, 11);
    expect(watcherMock).toHaveBeenCalledTimes(2);
  });

  it('`.off`: удаляет обработчик для данного триггера', () => {
    const changed = createEvent<number>();
    const $store = createStore(0).on(changed, (_, newState) => newState);

    changed(42);
    expect($store.getState()).toBe(42);

    $store.off(changed);

    changed(100500);
    expect($store.getState()).toBe(42);
  });

  it('`.reset`: cбрасывает состояние стора к исходному значению при срабатывании триггера', () => {
    const watcherMock = jest.fn();
    const increment = createEvent();
    const reset = createEvent();
    const $store = createStore(0)
      .on(increment, (state) => state + 1)
      .reset(reset);

    $store.watch(watcherMock);

    increment();
    expect($store.getState()).toBe(1);

    increment();
    expect($store.getState()).toBe(2);

    reset();
    expect($store.getState()).toBe(0);
  });
});
