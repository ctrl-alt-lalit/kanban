import { render } from '@testing-library/react';
import Board from '../../components/board';
import { createStrictColumnJson, createStrictKanbanJson, createTaskJson } from '../../util/kanban-type-functions';
import userEvent from '@testing-library/user-event';
import boardState from '../../util/board-state';

//TODO: test undo delete feature
//TODO: test drag and drop feature

function randomString() {
    return Math.random().toString().slice(0, 10);
}

function wait(ms: number) {
    return new Promise(resolve => {
        setTimeout(() => resolve(true), ms);
    });
}

describe('Board, Column, and Task', () => {

    it('renders data in a StrictKanbanJSON', async () => {
        const data = createStrictKanbanJson(
            randomString(),
            [
                createStrictColumnJson(
                    randomString(),
                    [
                        createTaskJson(randomString()),
                        createTaskJson(randomString()),
                        createTaskJson(randomString())
                    ],
                    '#000000' //variable color names don't work in test, but do work in prod
                ),
                createStrictColumnJson(
                    randomString(),
                    [createTaskJson()],
                    '#ff00ff'
                ),
                createStrictColumnJson(
                    randomString(),
                    [],
                    '#f0f0f0'
                )
            ],
            (Math.random() < 0.5)
        );

        //initialize board and wait for data to load
        boardState.save(data);
        const wrapper = render(<Board />);
        const board = wrapper.container;
        await wait(5);

        //check board title and autosave match data
        const boardTitle = board.querySelector('input.board-title') as HTMLInputElement;
        expect(boardTitle.value).toBe(data.title);

        const boardAutosaveIcon = board.querySelector('a.board-autosave span') as HTMLSpanElement;
        expect(boardAutosaveIcon.classList).toContain(data.autosave ? 'codicon-sync' : 'codicon-sync-ignored');

        //check that each column matches input data
        const columns = Array.from(board.querySelectorAll('.column'));
        expect(columns).toHaveLength(data.cols.length);
        for (let i = 0; i < columns.length; ++i) {
            const column = columns[i] as HTMLDivElement;
            const colData = data.cols[i];

            const columnTitle = column.querySelector('input.column-title') as HTMLInputElement;
            expect(columnTitle.value).toBe(colData.title);

            expect(column.style.borderColor).toBe(colData.color);
            //only checking border color since same operation is used to color everything else

            const tasks = Array.from(column.querySelectorAll('.task'));
            const taskTextArr = tasks.map(task => {
                const textField = task.querySelector('textarea.task-edit') as HTMLTextAreaElement;
                return textField.value;
            });
            expect(taskTextArr).toStrictEqual(colData.tasks.map(task => task.text));
        }

        wrapper.unmount();
    });

    const clickSave = (board: HTMLElement) => userEvent.click(board.querySelector('a.board-save')!);
    const clickSettings = (board: HTMLElement) => userEvent.click(board.querySelector('a.board-settings-toggle')!);

    it('can save its state', async () => {
        const wrapper = render(<Board />);
        const board = wrapper.container;
        await wait(5);

        const time1 = boardState.getCurrentState().timestamp;

        clickSave(board);
        const time2 = boardState.getCurrentState().timestamp;
        expect(time2).toBeGreaterThan(time1);

        userEvent.type(board, '{ctrl}s');
        const time3 = boardState.getCurrentState().timestamp;
        expect(time3).toBeGreaterThan(time2);

        wrapper.unmount();
    });

    it('can autosave', async () => {
        const wrapper = render(<Board />);
        const board = wrapper.container;
        await wait(5);

        boardState.save(createStrictKanbanJson());
        expect(boardState.getCurrentState().autosave).toBe(false);

        clickSettings(board);
        const autosaveButton = board.querySelector('a.board-autosave')!;
        userEvent.click(autosaveButton);

        expect(boardState.getCurrentState().autosave).toBe(true);

        wrapper.unmount();
    });

    it('can save to a file', async () => {
        const wrapper = render(<Board />);
        const board = wrapper.container;
        await wait(5);

        boardState.save(createStrictKanbanJson());
        expect(boardState.getCurrentState().saveToFile).toBe(false);

        clickSettings(board);
        const saveFileButton = board.querySelector('a.board-save-file')!;
        userEvent.click(saveFileButton);

        expect(boardState.getCurrentState().saveToFile).toBe(true);
    });

    it('has editable text', async () => {
        //save kanban board with 1 column and 1 task
        boardState.save(createStrictKanbanJson('', [createStrictColumnJson('', [createTaskJson()])]));
        const wrapper = render(<Board />);
        const board = wrapper.container;
        await wait(5);

        //edit task
        const task = board.querySelector('div.task') as HTMLDivElement;
        const taskDisplay = task.querySelector('div.task-display') as HTMLDivElement;
        userEvent.click(taskDisplay);
        const taskEdit = task.querySelector('textarea.task-edit') as HTMLTextAreaElement;
        userEvent.dblClick(taskEdit);
        const taskString = randomString();
        userEvent.type(taskEdit, taskString);

        //edit column title
        const columnTitle = board.querySelector('input.column-title') as HTMLInputElement;
        userEvent.dblClick(columnTitle);
        const columnString = randomString();
        userEvent.type(columnTitle, columnString);

        //edit board title
        const boardTitle = board.querySelector('input.board-title') as HTMLInputElement;
        userEvent.dblClick(boardTitle);
        const boardString = randomString();
        userEvent.type(boardTitle, boardString);

        //save changes and get current board state
        clickSave(board);
        await wait(5);
        let boardData = createStrictKanbanJson();
        const listener: (kanban: StrictKanbanJSON) => void = kanban => boardData = kanban;
        boardState.addChangeListener(listener);
        boardState.refresh();
        await wait(5);


        expect(boardData.title).toBe(boardString);
        expect(boardData.cols[0].title).toBe(columnString);
        expect(boardData.cols[0].tasks[0].text).toBe(taskString);

        boardState.removeChangeListener(listener);
        wrapper.unmount();
    });

    /* Autosave test is skipped since autosaving runs in intervals of 5 sec (which is too long for testing) */

    it('can add and delete columns', async () => {
        let numCols = 0;
        const listener: (kanban: StrictKanbanJSON) => void = kanban => numCols = kanban.cols.length;

        boardState.addChangeListener(listener);
        boardState.save(createStrictKanbanJson('', []));
        await wait(5);

        const wrapper = render(<Board />);
        const board = wrapper.container;
        await wait(5);

        //click add column button and save changes
        const addColumnButton = board.querySelector('a.board-add-column') as HTMLAnchorElement;
        userEvent.click(addColumnButton);
        await wait(5);
        expect(numCols).toBe(1);

        //click remove column button and save changes
        const deleteColumnButton = board.querySelector('a.column-delete') as HTMLAnchorElement;
        userEvent.click(deleteColumnButton);
        await wait(5);
        await wait(5);
        expect(numCols).toBe(0);

        boardState.removeChangeListener(listener);
        wrapper.unmount();
    });


    it('can add and delete tasks', async () => {
        let numTasks = 0;
        const listener: (kanban: StrictKanbanJSON) => void = kanban => numTasks = kanban.cols[0].tasks.length;

        boardState.addChangeListener(listener);
        boardState.save(createStrictKanbanJson('', [createStrictColumnJson('', [])])); //1 column, 0 tasks
        await wait(5);

        const wrapper = render(<Board />);
        const board = wrapper.container;
        await wait(5);

        //click add task and save changes
        const addTaskButton = board.querySelector('a.column-add-task') as HTMLAnchorElement;
        userEvent.click(addTaskButton);
        await wait(5);
        expect(numTasks).toBe(1);

        //click delete task and save changes
        const deleteTaskButton = board.querySelector('a.task-delete') as HTMLAnchorElement;
        userEvent.click(deleteTaskButton);
        await wait(5);
        expect(numTasks).toBe(0);

        boardState.removeChangeListener(listener);
        wrapper.unmount();
    });

    it("can change a column's color with a color picker", async () => {
        boardState.save(createStrictKanbanJson('', [createStrictColumnJson('', [])])); //1 column, 0 tasks
        await wait(5);

        const wrapper = render(<Board />);
        const board = wrapper.container;
        await wait(5);

        //color picker is initially closed
        const column = board.querySelector('div.column') as HTMLDivElement;
        const colorPicker = column.querySelector('div.column-color-picker') as HTMLDivElement;
        expect(colorPicker.style.maxHeight).toBe('0');

        //clicking the toggle opens picker
        const toggle = column.querySelector('a.column-color') as HTMLAnchorElement;
        userEvent.click(toggle);
        expect(colorPicker.style.maxHeight).not.toBe('0');

        //clicking a swatch changes the color
        const swatch = column.querySelector('button.column-color-picker__swatch') as HTMLButtonElement;
        userEvent.click(swatch);
        expect(column.style.color).toBe(swatch.style.backgroundColor);
        wrapper.unmount();
    });
});