export type DataTypes<Map, Key extends keyof Map> =
    Map extends never ? [never?] : Map[Key] extends never | undefined ? [never?] : [Map[Key]];

export type StoreActions<State, Actions> = {
    [Action in keyof Actions]: (state: State, ...data: DataTypes<Actions, Action>) => State;
};

export type StoreDispatch<Actions> =
    <Action extends keyof Actions>(event: Action, ...data: DataTypes<Actions, Action>) => void;

export type StoreSubscribe<State> = (handler: (state: State) => void) => () => void;

export type Store<State, Actions> = {
    getState: () => State;
    dispatch: StoreDispatch<Actions>;
    subscribe: StoreSubscribe<State>;
};

export function createStore<State, Actions>(
    initialState: State,
    actions: StoreActions<State, Actions>
): Store<State, Actions>;
