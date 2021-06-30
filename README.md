# ![Store Track Logo](logo.svg) Store Track

The simple state manager

💎 **Type safe**. TypeScript support out of box.

⚙️ **Framework agnostic**. Can work with any UI or server framework.

💻️ **Developer-friendly**. Simple API.

⚡️ **Maximum performance**. Static initialization provides boost in performance for runtime.

📦️ **Size**. No dependencies.

## Examples

```js
import { createStore } from 'store-track';

const counter = createStore(0, {
    add: (count, n) => count + n,
    sub: (count, n) => count - n,
    reset: () => 0
});

counter.subscribe(n => console.log('counter:', n));
// counter: 0

counter.dispatch('add', 10);
// counter: 10
counter.dispatch('sub', 5);
// counter: 5
counter.dispatch('reset');
// counter: 0
```

## Install

```sh
npm install --save store-track
# or
yarn add store-track
```

## Core Concepts

### Store

_Store_ is an object that holds state value.

```ts
// Create new store.
const store = createStore(
    // Initial state
    { count: 0 },
    // Declaring reducers and business logic
    { add: ({ count }, n) => ({ count: count + n }) }
);
```

* `.getState()` – Returns current state of store.
* `.dispatch(action, data)` – Calls a reducer with the appropriate `action` and the `data` passed to it.
* `.subscribe(handler)` – Call `handler` function each time when store is update. 

## TypeScript

**Store Track** allows you to declare the type of state, as well as the types of events and parameters for complete type safety.

```ts
import { createStore } from 'store-track';

// Actions declaration: map of event names to type of event data
interface Actions {
    // `set` event which goes with number as data
    set: number,
    // `inc` event which do not goes with any data
    inc: never
}

const counter = createStore<number, Actions>(0, {
    set: (count: number, n: number): number => n,
    inc: (count: number): number => count + 1,
});

// Correct calls:
counter.dispatch('set', 10);
counter.dispatch('inc');

// Compilation errors:
store.dispatch('inc', 100)   // `inc` doesn’t have data
store.dispatch('set', '100') // `set` event do not expect string data
store.dispatch('dec')        // Unknown event
```

## React

### Hook

```ts
import { useEffect, useReducer } from 'react';
import { Store } from 'store-track';

export function useStoreTrack<State, Actions>(store: Store<State, Actions>): State {
    const [, forceRender] = useReducer((s: number) => s + 1, 0);

    useEffect(
        () => store.subscribe(() => forceRender(1)),
        [store]
    );

    return store.getState();
}
```

## Inspiration

* [**Effector**](https://effector.dev/) – The state manager
* [**Redux**](https://redux.js.org/) – A Predictable State Container for JS Apps
* [**Storeon**](https://github.com/storeon/storeon) – Tiny (185 bytes) event-based Redux-like state manager for React and Preact

## License

[**MIT License**](LICENSE)
