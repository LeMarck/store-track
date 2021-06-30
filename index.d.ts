export type Args<A, B> = B extends (never | void) ? [A] : [A, B];

export type StoreDispatch<Actions> = <Action extends keyof Actions>(...args: Args<Action, Actions[Action]>) => void;

export type StoreActions<State, Actions> = {
    [Action in keyof Actions]: (...args: Args<State, Actions[Action]>) => State
}

export type Unsubscribe = () => void;

export type StoreSubscribe<State> = (handler: (state: State) => void) => Unsubscribe;

type Store<State, Actions> = {
    getState: () => State;
    dispatch: StoreDispatch<Actions>;
    subscribe: StoreSubscribe<State>;
};

export function createStore<State, Actions>(
    initialState: State,
    actions: StoreActions<State, Actions>
): Store<State, Actions>;
