import DelayedUpdater from '../util/delayed-updater';
import { wait } from '../test-helpers';

describe('DelayedUpdater', () => {
    it('calls a function after a certain amount of time', async () => {
        const du = new DelayedUpdater(5);
        const fn = jest.fn();

        du.tryUpdate(fn, '');
        expect(fn).not.toHaveBeenCalled();

        await wait(5);
        expect(fn).toHaveBeenCalled();
    });

    it('cancels an old function if a new one gets attempted with the same key', async () => {
        const du = new DelayedUpdater(5);
        const fn1 = jest.fn();
        const fn2 = jest.fn();

        du.tryUpdate(fn1, '');
        du.tryUpdate(fn2, '');

        await wait(5);
        expect(fn1).not.toHaveBeenCalled();
        expect(fn2).toHaveBeenCalled();
    });

    it('does not cancel an old function if a different key is provided', async () => {
        const du = new DelayedUpdater(5);
        const fn1 = jest.fn();
        const fn2 = jest.fn();

        du.tryUpdate(fn1, '1');
        du.tryUpdate(fn2, '2');

        await wait(5);
        expect(fn1).toHaveBeenCalled();
        expect(fn2).toHaveBeenCalled();
    });
});
