# ![Store Track Logo](logo.svg) Store Track

![GitHub Action Status](https://github.com/LeMarck/store-track/actions/workflows/test.yml/badge.svg)

Наивная реализация библиотеки менеджмента состояний [Effector](https://effector.dev/). Создана с целью разобраться как работает реактивное управление состоянием изнутри.

## Быстрый старт

```typescript
import { createStore, createEvent } from "store-track";

const increment = createEvent();
const decrement = createEvent();
const reset = createEvent();

const $counter = createStore(0)
  .on(increment, (state) => state + 1)
  .on(decrement, (state) => state - 1)
  .reset(reset);

$counter.watch((value) => console.log("counter:", value));
// counter: 0

increment(); // counter: 1
increment(); // counter: 2
decrement(); // counter: 1
reset();     // counter: 0
```

## API

### `createStore(defaultState)`

Создаёт реактивный стор с начальным состоянием.

```typescript
const $store = createStore(0);

$store.getState(); // 0
```

#### Методы

| Метод | Описание |
|-------|----------|
| `getState()` | Возвращает текущее состояние |
| `on(trigger, reducer)` | Подписывает стор на триггер; `trigger` может быть массивом |
| `off(trigger)` | Удаляет обработчик для триггера |
| `watch(fn)` | Вызывает `fn` при каждом обновлении стора; возвращает функцию отписки |
| `watch(trigger, fn)` | Вызывает `fn(state, payload)` при срабатывании триггера |
| `map(fn)` | Создаёт производный стор |
| `reset(...triggers)` | Сбрасывает состояние к начальному при срабатывании любого из триггеров |

```typescript
const changed = createEvent<string>();
const $title = createStore("").on(changed, (_, value) => value);

// map — производный стор
const $length = $title.map((title) => title.length);

// watch — наблюдатель
const unwatch = $length.watch((len) => console.log("length:", len));
// length: 0

changed("hello"); // length: 5

unwatch(); // отписаться

// reset
const reset = createEvent();
$title.reset(reset);
reset(); // $title.getState() === ""
```

---

### `createEvent()`

Создаёт событие — единицу передачи данных.

```typescript
const userUpdated = createEvent<{ name: string }>();
```

#### Методы

| Метод | Описание |
|-------|----------|
| `watch(fn)` | Подписывается на событие; возвращает функцию отписки |
| `map(fn)` | Создаёт производное событие с преобразованием данных |
| `prepend(fn)` | Создаёт событие-триггер, преобразующее данные перед вызовом исходного |
| `filterMap(fn)` | Как `map`, но пропускает вызов если `fn` возвращает `undefined` |
| `filter({ fn })` | Создаёт производное событие, срабатывающее только при `fn() === true` |

```typescript
const updateUser = createEvent<{ name: string; role: string }>();

// map
const nameUpdated = updateUser.map(({ name }) => name);
nameUpdated.watch((name) => console.log("name:", name));

// prepend
const changeName = updateUser.prepend((name: string) => ({ name, role: "user" }));
changeName("Alice"); // name: Alice

// filterMap
const effectorFound = createEvent<string[]>().filterMap((list) =>
  list.find((x) => x === "effector"),
);

// filter
const numbers = createEvent<number>();
const positives = numbers.filter({ fn: (x) => x > 0 });
```

---

### `createEffect(handler?)`

Создаёт эффект для работы с асинхронными операциями.

```typescript
const fetchUserFx = createEffect(async (id: number) => {
  const res = await fetch(`/api/users/${id}`);
  return res.json();
});
```

#### Свойства и методы

| Свойство / метод | Описание |
|------------------|----------|
| `done` | Событие с `{ params, result }` при успешном завершении |
| `doneData` | Событие только с результатом |
| `fail` | Событие с `{ params, error }` при ошибке |
| `failData` | Событие только с ошибкой |
| `finally` | Событие с `{ status, params, result \| error }` при любом завершении |
| `pending` | Стор `boolean` — `true` пока эффект выполняется |
| `use(handler)` | Подменяет реализацию эффекта |
| `use.getCurrent()` | Возвращает текущую реализацию |
| `watch(fn)` | Вызывает `fn(params)` при каждом вызове эффекта |
| `map(fn)` | Создаёт производное событие из параметров вызова |
| `prepend(fn)` | Создаёт событие-триггер для преобразования данных перед вызовом |

```typescript
fetchUserFx.pending.watch((isPending) => console.log("loading:", isPending));

fetchUserFx.done.watch(({ params, result }) =>
  console.log(`user ${params} loaded:`, result),
);

fetchUserFx.fail.watch(({ params, error }) =>
  console.error(`failed to load user ${params}:`, error),
);

fetchUserFx(42);
// loading: true
// loading: false
// user 42 loaded: { ... }
```

---

### `combine(...stores, fn)`

Создаёт производный стор, объединяя состояния нескольких сторов.

```typescript
const $balance = createStore(100);
const $username = createStore("Alice");

const $greeting = combine(
  $balance,
  $username,
  (balance, username) => `Hello, ${username}. Balance: ${balance}`,
);

$greeting.watch(console.log);
// Hello, Alice. Balance: 100
```

---

### `merge(...units)`

Объединяет несколько юнитов в одно событие, которое срабатывает при вызове любого из них.

```typescript
const foo = createEvent<number>();
const bar = createEvent<number>();

const fooOrBar = merge(foo, bar);
fooOrBar.watch((value) => console.log("triggered:", value));

foo(1); // triggered: 1
bar(2); // triggered: 2
```

---

### `createApi(store, api)`

Создаёт набор событий для обновления стора на основе объекта с редьюсерами.

```typescript
const $counter = createStore(0);

const { increment, add, reset } = createApi($counter, {
  increment: (state) => state + 1,
  add: (state, payload: number) => state + payload,
  reset: () => 0,
});

increment();  // $counter: 1
add(10);      // $counter: 11
reset();      // $counter: 0
```

---

## Типы

```typescript
type Unsubscribe = () => void;

type Unit<T> = Store<T> | Event<T> | Effect<T, unknown>;
```

## License

[MIT](LICENSE)
