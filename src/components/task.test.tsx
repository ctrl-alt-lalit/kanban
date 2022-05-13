import Task from '../components/task';
import boardState from '../util/board-state';
import { fireEvent, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createColumnJson, createKanbanJson, createTaskJson } from '../util/kanban-types';
import { randomString, rightClick } from '../util/test-helpers';

function* taskSetup() {
    const defaultKanban = createKanbanJson('', [createColumnJson('', [createTaskJson()])]);
    const defaultColumn = defaultKanban.cols[0];
    const defaultTask = defaultColumn.tasks[0];

    const wrapper = render(
        <Task
            data={defaultTask}
            index={0}
            columnId={defaultColumn.id}
            columnIndex={0}
            defaultToEdit={false}
            colorFilter={'#ffffff40'}
        />
    );
    const task = wrapper.container.firstElementChild as HTMLDivElement;
    yield task;

    wrapper.unmount();
}

jest.mock('react-beautiful-dnd', () => {
    const dragDropElem = ({ children }: { children: Function }) =>
        children(
            {
                draggableProps: {
                    style: {},
                },
                innerRef: jest.fn(),
            },
            {}
        );

    return {
        Droppable: dragDropElem,
        Draggable: dragDropElem,
        DragDropContext: ({ children }: { children: Function }) => children,
    };
});

jest.mock('react-markdown', () => (props: any) => {
    return <>{props.children}</>;
});

jest.mock('remark-gfm', () => () => {});

describe('<Task>', () => {
    it('Renders a task', () => {
        const taskData = createTaskJson(randomString());

        const wrapper = render(
            <Task
                data={taskData}
                index={0}
                columnId={''}
                columnIndex={0}
                defaultToEdit={false}
                colorFilter={'#ffffff40'}
            />
        );
        const task = wrapper.container.firstElementChild as HTMLDivElement;

        const textArea = task.querySelector('textarea')!;
        expect(textArea.value).toBe(taskData.text);
        expect(textArea.style.display).toBe('none');

        const displayArea = task.querySelector('.task-display') as HTMLDivElement;
        expect(displayArea.style.display).not.toBe('none');

        wrapper.unmount();
    });

    it('Can render a task in edit mode', () => {
        const wrapper = render(
            <Task
                data={createTaskJson()}
                index={0}
                columnId={''}
                columnIndex={0}
                defaultToEdit={true}
                colorFilter={'#ffffff40'}
            />
        );

        const task = wrapper.container.firstElementChild as HTMLDivElement;
        const displayArea = task.querySelector('.task-display') as HTMLDivElement;
        expect(displayArea.style.display).toBe('none');

        const textArea = task.querySelector('textarea')!;
        expect(textArea.style.display).not.toBe('none');
    });

    it('Is deleted when you click the delete button', () => {
        const setup = taskSetup();
        const task = setup.next().value as HTMLDivElement;

        const deleteButton = task.querySelector('a.task-delete')!;
        const removeTaskSpy = jest.spyOn(boardState, 'removeTask');

        userEvent.click(deleteButton);
        jest.runAllTimers();
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
            const task = setup.next().value as HTMLDivElement;

            const clicker = displayClicking(task);
            const textarea = clicker.next().value as HTMLTextAreaElement;

            const editSpy = jest.spyOn(boardState, 'setTaskText');
            userEvent.type(textarea, 'blah blah');
            textarea.blur();

            expect(editSpy).toHaveBeenCalled();
            setup.next();
        });

        it('Shows and hides the textarea', () => {
            const setup = taskSetup();
            const task = setup.next().value as HTMLDivElement;

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

    // Userevent not working with keyboard shortcuts for some reason
});
