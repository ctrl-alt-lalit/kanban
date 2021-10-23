import userEvent from "@testing-library/user-event";

export function wait(ms: number) {
    return new Promise(resolve => {
        setTimeout(() => resolve(true), ms);
    });
}

/**
 * @returns a random string of 10 characters
 */
export function randomString() {
    return Math.random().toString(36).slice(0, 10);
}

export function rightClick(element: HTMLElement) {
    userEvent.click(element, { button: 2 });
}

export function randomBoolean() {
    return Math.random() < 0.5;
}
