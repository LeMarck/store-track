exports.createStore = function createStore(initialState, actions) {
    let state = initialState;
    let subscriptions = [];

    return {
        getState: () => state,
        subscribe(handler) {
            subscriptions.push(handler);

            return () => subscriptions.splice(subscriptions.indexOf(handler) >>> 0, 1);
        },
        dispatch(action, data) {
            if (!actions[action]) return;

            state = actions[action](state, data);
            subscriptions.forEach(cb => cb(state));
        }
    };
};
