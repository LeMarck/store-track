exports.createStore = function createStore(initialState, actions) {
    let state = initialState;
    let subscriptions = [];

    return {
        subscribe(handler) {
            subscriptions.push(handler);

            handler(state);

            return () => {
                subscriptions = subscriptions.filter(cb => cb !== handler);
            };
        },
        dispatch(action, data) {
            if (actions[action]) {
                state = actions[action](state, data);
                subscriptions.forEach(cb => cb(state));
            }
        },
        getState() {
            return state;
        }
    };
};
