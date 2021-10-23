import Task from "../../components/task";
import boardState from "../../util/board-state";
import { fireEvent, render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createStrictColumnJson, createStrictKanbanJson, createTaskJson } from "../../util/kanban-type-functions";
import { randomString, rightClick } from "../helpers";


function* taskSetup() {
    const defaultKanban = createStrictKanbanJson('', [createStrictColumnJson('', [createTaskJson()])]);
    const defaultColumn = defaultKanban.cols[0];
    const defaultTask = defaultColumn.tasks[0];

    const wrapper = render(<Task data={defaultTask} index={0} columnId={defaultColumn.id} />);
    const task = wrapper.container.firstElementChild as HTMLDivElement;
    yield task;

    wrapper.unmount();
}

jest.mock('react-beautiful-dnd', () => {
    const dragDropElem = ({ children }: { children: Function }) => children({
        draggableProps: {
            style: {},
        },
        innerRef: jest.fn(),
    }, {});


    return {
        Droppable: dragDropElem,
        Draggable: dragDropElem,
        DragDropContext: ({ children }: { children: Function }) => children,
    };
});


describe('<Task>', () => {
    it('Renders a task', () => {
        const taskData = createTaskJson(randomString());

        const wrapper = render(<Task data={taskData} index={0} columnId={''} />);
        const task = wrapper.container.firstElementChild as HTMLDivElement;

        const textarea = task.querySelector('textarea')!;
        expect(textarea.value).toBe(taskData.text);

        wrapper.unmount();
    });

    it('Is deleted when you click the delete button', () => {
        const setup = taskSetup();
        const task = setup.next().value!;

        const deleteButton = task.querySelector('a.task-delete')!;
        const removeTaskSpy = jest.spyOn(boardState, 'removeTask');

        userEvent.click(deleteButton);
        expect(removeTaskSpy).toHaveBeenCalled();

        setup.next();
    });

    describe('Text Display', () => {
        function* displayClicking(task: HTMLDivElement) {
            const displaySection = task.querySelector('.task-display') as HTMLDivElement;
            const textarea = task.querySelector('textarea')!;

            userEvent.click(displaySection);
            userEvent.click(textarea);

            yield textarea;

            fireEvent.blur(textarea);
        }

        it('Is editable', () => {
            const setup = taskSetup();
            const task = setup.next().value!;

            const clicker = displayClicking(task);
            const textarea = clicker.next().value!;

            const editSpy = jest.spyOn(boardState, 'changeTaskText');
            userEvent.type(textarea, 'blah blah');

            expect(editSpy).toHaveBeenCalled();
            setup.next();
        });

        it('Shows and hides the textarea', () => {
            const setup = taskSetup();
            const task = setup.next().value!;

            const textarea = task.querySelector('textarea')!;
            expect(textarea.style.display).toBe('none');

            const clicker = displayClicking(task);
            clicker.next();

            expect(textarea.style.display).not.toBe('none');
            clicker.next();

            expect(textarea.style.display).toBe('none');
            setup.next();
        });
    });

    it('Does not propagate a contextmenu event', () => {
        const setup = taskSetup();
        const task = setup.next().value!;

        const propagateSpy = jest.spyOn(MouseEvent.prototype, 'stopPropagation');
        rightClick(task);

        expect(propagateSpy).toHaveBeenCalled();
        setup.next();
    });
});
