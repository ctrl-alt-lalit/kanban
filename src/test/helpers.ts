import userEvent from "@testing-library/user-event";
import clone from "just-clone";

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

/*
export function mockReactBeautifulDND() {
    return jest.mock('react-beautiful-dnd', () => {
        const dragDropElem = ({ children }: { children: Function }) => children({
            draggableProps: {
                style: {},
            },
            innerRef: jest.fn(),
        }, {});


        return {
            Droppable: clone(dragDropElem),
            Draggable: clone(dragDropElem),
            DragDropContext: ({ children }: { children: Function }) => children,
        };
    });
}
*/