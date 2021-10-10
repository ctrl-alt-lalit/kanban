
class DelayedUpdater {
    constructor(msDelay: number) {
        this.delay = msDelay;
    }

    public tryUpdate(callback: () => void, timeoutKey: string = '') {
        if (this.timeoutMap.has(timeoutKey)) {
            const oldTimeout = this.timeoutMap.get(timeoutKey);
            if (oldTimeout) {
                clearTimeout(oldTimeout);
            }
        }

        const timeout = setTimeout(callback, this.delay);
        this.timeoutMap.set(timeoutKey, timeout);
    }

    private delay: number;
    private timeoutMap: Map<string, NodeJS.Timeout> = new Map();
}


export default DelayedUpdater;