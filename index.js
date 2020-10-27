function createStore(initialState, actions) {
    let state = initialState;
    let subscriptions = [];

    return {
        subscribe(callback) {
            subscriptions.push(callback);

            callback(state);

            return () => {
                subscriptions = subscriptions.filter(cb => cb !== callback);
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
}

module.exports = { createStore };
