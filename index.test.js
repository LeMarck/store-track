const { createStore } = require('./index');

it('should be created storage', () => {
    const store = createStore(0, {});
    expect(Object.keys(store)).toEqual(['subscribe', 'dispatch', 'getState']);
});

it('`.getState` should return the current state', () => {
    const store = createStore(0, { set: (state, newNum) => newNum });
    expect(store.getState()).toEqual(0);

    store.dispatch('set', 10);
    expect(store.getState()).toEqual(10);
});

it('`.subscribe` must subscribe to state change events', () => {
    const store = createStore(0, { set: (state, newNum) => newNum });
    const onChangeState = jest.fn();
    const unsubscribe = store.subscribe(onChangeState);

    expect(onChangeState).toBeCalledTimes(1);
    expect(onChangeState).toBeCalledWith(0);

    store.dispatch('set', 10);
    expect(onChangeState).toBeCalledTimes(2);
    expect(onChangeState).toBeCalledWith(10);

    unsubscribe();

    store.dispatch('set', 100);
    expect(onChangeState).toBeCalledTimes(2);
});

it('`.dispatch` should call the action', () => {
    const setState = jest.fn();
    const store = createStore(0, { set: setState });

    store.dispatch('set', 10);

    expect(setState).toBeCalledTimes(1);
    expect(setState).toBeCalledWith(0, 10);

    store.dispatch('unknown', 10);

    expect(setState).toBeCalledTimes(1);
    expect(setState).toBeCalledWith(0, 10);
});
