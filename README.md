# ![Store Track Logo](logo.svg) Store Track

The simple Redux-like state manager

💎 **Type safe**. TypeScript support out of box.

⚙️ **Framework agnostic**. Can work with any UI or server framework.

💻️ **Developer-friendly**. Simple API surface and helpful community.

⚡️ **Maximum performance**. Static initialization provides boost in performance for runtime.

📦️ **Tiny bundle size**. 115 bytes (minified and gzipped). No dependencies.

## Install

```sh
npm install --save store-track
# or
yarn add store-track
```

## Examples

```js
import { createStore } from 'store-track';

const counter = createStore(0, {
    add: (count, n) => count + n,
    sub: (count, n) => count - n,
    reset: () => 0,
});

counter.subscribe(n => console.log('counter:', n));     // counter: 0

counter.dispatch('add', 10);    // counter: 10
counter.dispatch('sub', 5);     // counter: 5
counter.dispatch('reset');      // counter: 0
```

## React Components

```jsx
import React, { useState, useEffect } from 'react';
import { createStore } from 'store-track';

function useStore(store) {
    const [state, setState] = useState(store.getState());
    
    useEffect(() => {
        const unsubscribe = store.subscribe(setState);
        return () => unsubscribe();
    }, [store]);
    
    return state;
}

const counter = createStore(0, {
    add: count => count + 1,
    sub: count => count - 1,
    reset: () => 0,
});

function Counter() {
    const state = useStore(counter);

    return <>
        <p>{state}</p>
        <button onClick={() => counter.dispatch('add')}>add</button>
        <button onClick={() => counter.dispatch('sub')}>sub</button>
        <button onClick={() => counter.dispatch('reset')}>reset</button>
    </>
}
```

## TypeScript

```ts
import { createStore } from 'store-track';

interface Actions {
    set: number,
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

## License

[**MIT License**](LICENSE)
