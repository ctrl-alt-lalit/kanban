class DelayedUpdater {
    constructor(msDelay: number) {
        this.delay = msDelay;
    }

    public tryUpdate(callback: () => void, timeoutKey: string) {
        if (this.timeoutMap.has(timeoutKey)) {
            const oldTimeout = this.timeoutMap.get(timeoutKey)!;
            window.clearTimeout(oldTimeout);
        }

        const timeout = window.setTimeout(callback, this.delay);
        this.timeoutMap.set(timeoutKey, timeout);
    }

    private delay: number;
    private timeoutMap: Map<string, number> = new Map();
}

export default DelayedUpdater;
