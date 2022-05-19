import Column from '../column';
import boardState from '../../util/board-state';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createColumnJson, createKanbanJson, createTaskJson } from '../../util/kanban-types';
import { randomString, rightClick } from '../../util/test-helpers';

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
jest.mock('remark-breaks', () => () => {});

const defaultKanban = createKanbanJson('', [createColumnJson()]);
const defaultColumn = defaultKanban.cols[0];

function* columnSetup(index = 0, numCols = 1) {
    const wrapper = render(<Column data={defaultColumn} numCols={numCols} index={index} />);
    const column = wrapper.container.firstElementChild as HTMLDivElement;
    yield column;

    wrapper.unmount();
}

function clickSettings(column: HTMLDivElement) {
    const settingsButton = column.querySelector('a.column-settings-toggle')!;
    userEvent.click(settingsButton);
}

function* settingsSetup(index = 0, numCols = 0) {
    const setup = columnSetup(index, numCols);
    const column = setup.next().value as HTMLDivElement;
    clickSettings(column);
    const settings = column.querySelector('.column-settings') as HTMLDivElement;
    yield settings;

    setup.next();
}

describe('<Column />', () => {
    it('renders a column', () => {
        const columnData = createColumnJson(randomString(), [createTaskJson(), createTaskJson()]);
        const wrapper = render(<Column data={columnData} numCols={1} index={0} />);
        const column = wrapper.container.firstElementChild as HTMLDivElement;

        const title = column.querySelector('.column-titlebar input') as HTMLInputElement;
        const taskList = column.querySelector('.column-tasks') as HTMLDivElement;

        expect(title.value).toEqual(columnData.title);
        expect(taskList.childElementCount).toEqual(columnData.tasks.length);

        wrapper.unmount();
    });

    describe('titlebar', () => {
        it('has an editable title', () => {
            const setup = columnSetup();
            const column = setup.next().value as HTMLDivElement;

            const title = column.querySelector('.column-titlebar input') as HTMLInputElement;
            const editSpy = jest.spyOn(boardState, 'setColumnTitle');

            userEvent.dblClick(title);
            userEvent.type(title, 'blah');
            title.blur();

            expect(editSpy).toHaveBeenCalled();
            setup.next();
        });

        it('can open and close the settings panel', () => {
            const setup = columnSetup();
            const column = setup.next().value as HTMLDivElement;

            const settings = column.querySelector('.column-settings') as HTMLDivElement;
            expect(settings.style.maxHeight).toBe('0');

            clickSettings(column);
            expect(settings.style.maxHeight).not.toBe('0');

            clickSettings(column);
            expect(settings.style.maxHeight).toBe('0');
            setup.next();
        });
    });

    it('can add a task', () => {
        const setup = columnSetup();
        const column = setup.next().value as HTMLDivElement;

        const addTaskButton = column.querySelector('a.column-add-task')!;
        const addSpy = jest.spyOn(boardState, 'addTask');
        addSpy.mockClear();

        userEvent.click(addTaskButton);
        expect(addSpy).toHaveBeenCalled();

        setup.next();
    });

    it('can open a custom context menu', () => {
        const setup = columnSetup();
        const column = setup.next().value as HTMLDivElement;

        const spy = jest.spyOn(MouseEvent.prototype, 'preventDefault');
        rightClick(column);

        expect(spy).toHaveBeenCalled();
        setup.next();
    });

    describe('context menu', () => {
        function* contextSetup() {
            const setup = columnSetup();
            const column = setup.next().value as HTMLDivElement;
            rightClick(column);

            const contextMenu = column.querySelector('.szh-menu') as HTMLUListElement;
            yield contextMenu;

            setup.next();
        }

        it('can add a task', () => {
            const setup = contextSetup();
            const menu = setup.next().value as HTMLUListElement;

            const addButton = menu.firstElementChild!;
            const addSpy = jest.spyOn(boardState, 'addTask');
            addSpy.mockClear();

            userEvent.click(addButton);
            expect(addSpy).toHaveBeenCalled();
            setup.next();
        });

        it('can delete a column', () => {
            const setup = contextSetup();
            const menu = setup.next().value as HTMLUListElement;

            const deleteButton = menu.children[1]!;
            const deleteSpy = jest.spyOn(boardState, 'removeColumn');
            deleteSpy.mockClear();

            userEvent.click(deleteButton);
            expect(deleteSpy).toHaveBeenCalled();
            setup.next();
        });
    });
});
