import { createEvent } from './event';

describe('createEvent', () => {
  it('should be defined Event', () => {
    const event = createEvent();

    expect(event).toBeDefined();
  });

  it('`.watch`: вызывает функцию с сайд-эффектами при каждом срабатывании события', () => {
    const event = createEvent<string>();
    const watcherMock = jest.fn();
    const unwatch = event.watch(watcherMock);

    event('Hello!');
    expect(watcherMock).toHaveBeenCalledWith('Hello!');

    unwatch();
    event('World');
    expect(watcherMock).not.toHaveBeenCalledWith('World');
    expect(watcherMock).toHaveBeenCalledTimes(1);
  });

  it('`.map`: создает производное событие на основе данных из исходного', () => {
    const updateUser = createEvent<{ name: string; role: string }>();
    const userNameUpdated = updateUser.map(({ name }) => name);
    const userRoleUpdated = updateUser.map(({ role }) => role.toUpperCase());
    const userNameUpdatedWatcherMock = jest.fn();
    const userRoleUpdatedWatcherMock = jest.fn();

    userNameUpdated.watch(userNameUpdatedWatcherMock);
    userRoleUpdated.watch(userRoleUpdatedWatcherMock);

    updateUser({ name: 'John', role: 'admin' });

    expect(userNameUpdatedWatcherMock).toHaveBeenCalledWith('John');
    expect(userRoleUpdatedWatcherMock).toHaveBeenCalledWith('ADMIN');
  });

  it('`.prepend`: создает событие-триггер для преобразования данных перед запуском исходного эвента', () => {
    const watcherMock = jest.fn();
    const userPropertyChanged = createEvent<{ field: string; value: string }>();
    const changeName = userPropertyChanged.prepend((name: string) => ({
      field: 'name',
      value: name,
    }));
    const changeRole = userPropertyChanged.prepend((role: string) => ({
      field: 'role',
      value: role.toUpperCase(),
    }));

    userPropertyChanged.watch(watcherMock);

    changeName('John');
    expect(watcherMock).toHaveBeenCalledWith({ field: 'name', value: 'John' });

    changeRole('admin');
    expect(watcherMock).toHaveBeenCalledWith({ field: 'role', value: 'ADMIN' });

    changeName('Alice');
    expect(watcherMock).toHaveBeenCalledWith({ field: 'name', value: 'Alice' });
  });

  it('`.filterMap`: создает производное событие на основе данных из исходного с возможностью отмены вызова', () => {
    const listReceived = createEvent<string[]>();
    const effectorFound = listReceived.filterMap((list: string[]) => list.find((name) => name === 'effector'));
    const watcherMock = jest.fn();

    effectorFound.watch(watcherMock);

    listReceived(['redux', 'mobx']);
    expect(watcherMock).not.toHaveBeenCalled();

    listReceived(['redux', 'effector', 'mobx']);
    expect(watcherMock).toHaveBeenCalledWith('effector');
  });

  it('`.filter`: cоздает производное событие с возможностью отмены вызова', () => {
    const numbers = createEvent<{ x: number }>();
    const positiveNumbers = numbers.filter({ fn: ({ x }) => x > 0 });
    const numberWatcherMock = jest.fn();
    const watcherMock = jest.fn();

    numbers.watch(numberWatcherMock);
    positiveNumbers.watch(watcherMock);

    numbers({ x: 0 });
    expect(watcherMock).not.toHaveBeenCalled();
    expect(numberWatcherMock).toHaveBeenCalled();

    numbers({ x: -10 });
    expect(watcherMock).not.toHaveBeenCalled();
    expect(numberWatcherMock).toHaveBeenCalled();

    numbers({ x: 10 });
    expect(watcherMock).toHaveBeenCalled();
    expect(watcherMock).toHaveBeenCalledWith({ x: 10 });
    expect(numberWatcherMock).toHaveBeenCalled();
  });
});
