import userEvent from '@testing-library/user-event';

/**
 * @ignore
 * Wait for a specified number of milliseconds
 * @param ms milliseconds to wait for
 */
export function wait(ms: number) {
    return new Promise((resolve) => {
        setTimeout(() => resolve(true), ms);
    });
}

/**
 * @ignore
 * @returns a random string of 10 characters
 */
export function randomString() {
    return Math.random().toString(36).slice(0, 10);
}

/**
 * @ignore
 * Right clicks on an HTMLElement
 * @param element HTMLElement to click on
 */
export function rightClick(element: HTMLElement) {
    userEvent.click(element, { button: 2 });
}

/**
 * @ignore
 * @returns True or False at random
 */
export function randomBoolean() {
    return Math.random() < 0.5;
}

/**
 * @ignore
 * @param hi highest number to return (exclusive)
 * @param lo lowest number to return (inclusive)
 * @returns a random integer in the range [lo, hi)
 */
export function randomInteger(hi = 1_000_000_000, lo = 0) {
    return Math.floor(Math.random() * (hi - lo)) + lo;
}
