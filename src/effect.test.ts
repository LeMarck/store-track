import { createEffect } from './effect';

describe('createEffect', () => {
  it('should be defined Effect', async () => {
    const emptyEffect = createEffect();
    const effect = createEffect(() => 1);

    expect(emptyEffect).toBeDefined();
    expect(effect).toBeDefined();
    await expect(emptyEffect(1)).rejects.toThrow('No handler used in effect');
  });

  it('`.use`: определяет имплементацию эффекта: функцию, которая будет вызвана при срабатывании', () => {
    const effectFn = jest.fn();
    const effect = createEffect(jest.fn);

    expect(effect.use.getCurrent()).not.toEqual(effectFn);

    effect.use(effectFn);
    expect(effect.use.getCurrent()).toEqual(effectFn);
  });

  it('`.map`: создает производное событие на основе данных эффекта', async () => {
    const updateUserFx = createEffect<{ name: string; role: string }, boolean>(() => true);
    const userNameUpdate = updateUserFx.map(({ name }) => name);
    const userRoleUpdate = updateUserFx.map(({ role }) => role.toUpperCase());
    const mockUserNameUpdatedWatch = jest.fn();
    const mockUserRoleUpdatedWatch = jest.fn();

    userNameUpdate.watch(mockUserNameUpdatedWatch);
    userRoleUpdate.watch(mockUserRoleUpdatedWatch);

    const result = await updateUserFx({ name: 'John', role: 'admin' });

    expect(result).toBe(true);
    expect(mockUserNameUpdatedWatch).toHaveBeenCalledWith('John');
    expect(mockUserRoleUpdatedWatch).toHaveBeenCalledWith('ADMIN');
  });

  it('`.prepend`: создаёт событие-триггер для преобразования данных перед запуском эффекта', () => {
    const mockWatcher = jest.fn();
    const updateUserFx = createEffect<{ name: string; role: string }, boolean>(() => true);
    const changeName = updateUserFx.prepend((name: string) => ({ role: 'user', name }));

    updateUserFx.watch(mockWatcher);

    changeName('John');
    expect(mockWatcher).toHaveBeenCalledWith({ role: 'user', name: 'John' });
  });

  it('`.watch`: вызывает дополнительную функцию с сайд-эффектами при каждом срабатывании эффекта', async () => {
    const fx = createEffect(({ title }: { title: string }) => title);
    const watcherMock = jest.fn();
    const unwatch = fx.watch(watcherMock);

    await expect(fx({ title: 'Title1' })).resolves.toBe('Title1');
    expect(watcherMock).toHaveBeenCalledWith({ title: 'Title1' });
    expect(watcherMock).toHaveBeenCalledTimes(1);

    unwatch();

    await expect(fx({ title: 'Title2' })).resolves.toBe('Title2');
    expect(watcherMock).toHaveBeenCalledTimes(1);
  });

  it('`.finally`: событие, которое срабатывает при завершении эффекта с подробной информацией об аргументах, результатах и статусе выполнения', async () => {
    const watcherMock = jest.fn();
    const fetchApiFx = createEffect(async ({ ok }: { ok: boolean }) => {
      await new Promise((resolve) => {
        setTimeout(resolve, 500);
      });
      if (ok) return 'SUCCESS';
      throw Error('ERROR');
    });

    fetchApiFx.finally.watch(watcherMock);

    const result = await fetchApiFx({ ok: true });
    expect(result).toEqual('SUCCESS');
    expect(watcherMock).toHaveBeenCalledWith({
      status: 'done',
      params: {
        ok: true,
      },
      result: 'SUCCESS',
    });

    await expect(fetchApiFx({ ok: false })).rejects.toThrow('ERROR');
    expect(watcherMock).toHaveBeenCalledWith({
      status: 'fail',
      params: {
        ok: false,
      },
      error: Error('ERROR'),
    });
  });

  it('`.pending`: стор, который показывает, что эффект находится в процессе выполнения', async () => {
    const watcherMock = jest.fn();
    const fetchApiFx = createEffect(
      async (ms: number) =>
        new Promise((resolve) => {
          setTimeout(resolve, ms);
        })
    );

    fetchApiFx.pending.watch((value) => watcherMock(value));

    await fetchApiFx(100);

    expect(watcherMock.mock.calls).toEqual([[false], [true], [false]]);
  });

  it('`.done/doneData`: события, которое срабатывают с результатом выполнения эффекта', async () => {
    const fetchApiFx = createEffect((data: number) => data);
    const doneWatcherMock = jest.fn();
    const doneDataWatcherMock = jest.fn();

    fetchApiFx.done.watch(doneWatcherMock);
    fetchApiFx.doneData.watch(doneDataWatcherMock);

    await fetchApiFx(42);

    expect(doneDataWatcherMock).toHaveBeenCalledWith(42);
    expect(doneWatcherMock).toHaveBeenCalledWith({ params: 42, result: 42 });
  });

  it('`.fail/failData`: события, которое срабатывают с ошибкой, возникшей при выполнении эффекта', async () => {
    const fetchApiFx = createEffect((data: string) => {
      throw Error(data);
    });
    const failWatcherMock = jest.fn();
    const failDataWatcherMock = jest.fn();

    fetchApiFx.fail.watch(failWatcherMock);
    fetchApiFx.failData.watch(failDataWatcherMock);

    await fetchApiFx('42').catch(() => 1);

    expect(failDataWatcherMock).toHaveBeenCalledWith(Error('42'));
    expect(failWatcherMock).toHaveBeenCalledWith({ params: '42', error: Error('42') });
  });
});
