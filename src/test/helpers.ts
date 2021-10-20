export function wait(ms: number) {
    return new Promise(resolve => {
        setTimeout(() => resolve(true), ms);
    });
}

/**
 * @returns a random string of 10 characters
 */
export function randStr() {
    return Math.random().toString(36).slice(0, 10);
}
