import Column from "../../components/column";
import boardState from "../../util/board-state";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createStrictColumnJson, createStrictKanbanJson, createTaskJson } from "../../util/kanban-type-functions";
import { randomString, rightClick } from "../helpers";

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

const defaultKanban = createStrictKanbanJson('', [createStrictColumnJson()]);
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
    const column = setup.next().value!;
    clickSettings(column);
    const settings = column.querySelector('.column-settings') as HTMLDivElement;
    yield settings;

    setup.next();
}

function* colorSetup() {
    const setup = settingsSetup();
    const settings = setup.next().value!;

    const colorToggle = settings.querySelector('.column-color')!;
    userEvent.click(colorToggle);

    const colorPicker = settings.parentElement!.querySelector('.column-color-picker') as HTMLDivElement;
    yield colorPicker;

    setup.next();
}


describe('<Column />', () => {
    it('renders a column', () => {
        const columnData = createStrictColumnJson(randomString(), [createTaskJson(), createTaskJson()]);
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
            const column = setup.next().value!;

            const title = column.querySelector('.column-titlebar input') as HTMLInputElement;
            const editSpy = jest.spyOn(boardState, 'changeColumnTitle');

            userEvent.dblClick(title);
            userEvent.type(title, 'blah');

            expect(editSpy).toHaveBeenCalled();
            setup.next();
        });

        it('can open and close the settings panel', () => {
            const setup = columnSetup();
            const column = setup.next().value!;

            const settings = column.querySelector('.column-settings') as HTMLDivElement;
            expect(settings.style.maxHeight).toBe('0');

            clickSettings(column);
            expect(settings.style.maxHeight).not.toBe('0');

            clickSettings(column);
            expect(settings.style.maxHeight).toBe('0');
            setup.next();
        });
    });

    describe('settings panel', () => {

        it('can delete this column', () => {
            const setup = settingsSetup();
            const settings = setup.next().value!;

            const deleteButton = settings.querySelector('.column-delete')!;
            const deleteSpy = jest.spyOn(boardState, 'removeColumn');
            deleteSpy.mockClear();

            userEvent.click(deleteButton);
            expect(deleteSpy).toHaveBeenCalled();
            setup.next();
        });

        describe('move-column buttons', () => {
            it('can move a column left and right', () => {
                const setup = settingsSetup(1, 3);
                const settings = setup.next().value!;

                const moveSpy = jest.spyOn(boardState, 'moveColumn');

                const leftButton = settings.querySelector('.column-left')!;
                userEvent.click(leftButton);

                const rightButton = settings.querySelector('.column-right')!;
                userEvent.click(rightButton);

                expect(moveSpy).toHaveBeenCalledTimes(2);
                setup.next();
            });

            it('does not show up if a column has no left/right neighbors', () => {
                const setup = settingsSetup();
                const settings = setup.next().value!;

                const leftButton = settings.querySelector('.column-left') as HTMLAnchorElement;
                const rightButton = settings.querySelector('.column-right') as HTMLAnchorElement;

                expect(leftButton.style.display).toBe('none');
                expect(rightButton.style.display).toBe('none');

                setup.next();
            });
        });

        it('can open and close the color picker', () => {
            const setup = settingsSetup();
            const settings = setup.next().value!;

            const colorPicker = settings.parentElement!.querySelector('.column-color-picker') as HTMLDivElement;
            expect(colorPicker.style.maxHeight).toBe('0');

            const colorToggle = settings.querySelector('.column-color')!;
            userEvent.click(colorToggle);
            expect(colorPicker.style.maxHeight).not.toBe('0');

            userEvent.click(colorToggle);
            expect(colorPicker.style.maxHeight).toBe('0');
            setup.next();
        });
    });

    describe('Color picker', () => {
        it("can change a column's color with clickable swatches", () => {
            const setup = colorSetup();
            const picker = setup.next().value!;

            const swatch = picker.querySelector('button')!;
            const changeSpy = jest.spyOn(boardState, 'changeColumnColor');
            changeSpy.mockClear();

            userEvent.click(swatch);
            expect(changeSpy).toHaveBeenCalled();
            setup.next();
        });

        describe('text input', () => {
            function* inputSetup() {
                const setup = colorSetup();
                const picker = setup.next().value!;

                const input = picker.querySelector('.text-picker input') as HTMLInputElement;
                userEvent.clear(input);
                yield input;

                setup.next();
            }

            it("can change a column's color", () => {
                const setup = inputSetup();
                const input = setup.next().value!;

                const changeSpy = jest.spyOn(boardState, 'changeColumnColor');
                changeSpy.mockClear();
                userEvent.type(input, 'aaaaaa');

                expect(changeSpy).toHaveBeenCalled();
                setup.next();
            });

            it("does not change color if there's less than 6 characters", () => {
                const setup = inputSetup();
                const input = setup.next().value!;

                const changeSpy = jest.spyOn(boardState, 'changeColumnColor');
                changeSpy.mockClear();
                userEvent.type(input, 'aaa');

                expect(changeSpy).not.toHaveBeenCalled();
                setup.next();
            });
        });
    });

    it('can add a task', () => {
        const setup = columnSetup();
        const column = setup.next().value!;

        const addTaskButton = column.querySelector('a.column-add-task')!;
        const addSpy = jest.spyOn(boardState, 'addTask');
        addSpy.mockClear();

        userEvent.click(addTaskButton);
        expect(addSpy).toHaveBeenCalled();

        setup.next();
    });

    it('can open a custom context menu', () => {
        const setup = columnSetup();
        const column = setup.next().value!;

        const spy = jest.spyOn(MouseEvent.prototype, 'preventDefault');
        rightClick(column);

        expect(spy).toHaveBeenCalled();
        setup.next();
    });

    describe('context menu', () => {
        function* contextSetup() {
            const setup = columnSetup();
            const column = setup.next().value!;
            rightClick(column);

            const contextMenu = column.querySelector('.szh-menu') as HTMLUListElement;
            yield contextMenu;

            setup.next();
        }

        it('can add a task', () => {
            const setup = contextSetup();
            const menu = setup.next().value!;

            const addButton = menu.firstElementChild!;
            const addSpy = jest.spyOn(boardState, 'addTask');
            addSpy.mockClear();

            userEvent.click(addButton);
            expect(addSpy).toHaveBeenCalled();
            setup.next();
        });

        it('can delete a column', () => {
            const setup = contextSetup();
            const menu = setup.next().value!;

            const deleteButton = menu.children[1]!;
            const deleteSpy = jest.spyOn(boardState, 'removeColumn');
            deleteSpy.mockClear();

            userEvent.click(deleteButton);
            expect(deleteSpy).toHaveBeenCalled();
            setup.next();
        });
    });
});