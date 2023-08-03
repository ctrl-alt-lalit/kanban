import userEvent from '@testing-library/user-event';

/**
 * Wait for a specified number of milliseconds
 * @param ms milliseconds to wait for
 * @ignore
 */
export function wait(ms: number) {
    return new Promise((resolve) => {
        setTimeout(() => resolve(true), ms);
    });
}

/**
 * @returns a random string of 10 characters
 * @ignore
 */
export function randomString() {
    return Math.random().toString(36).slice(0, 10);
}

/**
 * Right clicks on an HTMLElement
 * @param element HTMLElement to click on
 * @ignore
 */
export function rightClick(element: HTMLElement) {
    userEvent.pointer({ target: element, keys: '[MouseRight]' });
}

/**
 * @returns True or False at random
 * @ignore
 */
export function randomBoolean() {
    return Math.random() < 0.5;
}

/**
 * @param hi highest number to return (exclusive)
 * @param lo lowest number to return (inclusive)
 * @returns a random integer in the range [lo, hi)
 * @ignore
 */
export function randomInteger(hi = 1_000_000_000, lo = 0) {
    return Math.floor(Math.random() * (hi - lo)) + lo;
}
