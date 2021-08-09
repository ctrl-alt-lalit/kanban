import {render} from '@testing-library/react';
import Board from '../../components/board';
import { createStrictColumnJson, createStrictKanbanJson, createTaskJson } from '../../util/kanban-type-functions';
import VsCodeHandler from '../../util/vscode-handler';
import userEvent from '@testing-library/user-event';

jest.mock('../../util/vscode-handler', () => {
    return function() {
        let savedData = createStrictKanbanJson();
        let callbacks: Array<(data: StrictKanbanJSON) => void> = [];

        return {
            save: (data: StrictKanbanJSON) => savedData = data,
            load: () => callbacks.forEach(cb => cb(savedData)),

            addLoadListener: (callback: (data: StrictKanbanJSON) => void) => callbacks.push(callback),
            removeLoadListener: (callback: (data: StrictKanbanJSON) => void) => callbacks = callbacks.filter(cb => cb !== callback),
        };
    };
});

function makeVsCodeHandler() {
    const api: VsCodeApi = {
        getState: () => {return;},
        setState: () => {return;},
        postMessage: () => {return;}
    };
    return new VsCodeHandler(api);
}

//TODO: mock toast to keep track of that
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

describe('<Board>, <Column>, and <Task>', () => {

    it ('renders data in a StrictKanbanJSON', async () => {
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
        const vscode = makeVsCodeHandler();
        vscode.save(data);
        const wrapper = render(<Board vscode={vscode}/>);
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

    it('can save its state', async () => {
        const vscode = makeVsCodeHandler();
        let savedCalled = false;
        vscode.save = () => savedCalled = true;

        const wrapper = render(<Board vscode={vscode}/>);
        const board = wrapper.container;
        await wait(5);

        const saveButton = board.querySelector('a.board-save') as HTMLAnchorElement;
        userEvent.click(saveButton);
        expect(savedCalled).toBe(true);

        savedCalled = false;
        userEvent.type(board, '{ctrl}s');
        expect(savedCalled).toBe(true);

        wrapper.unmount();
    });

    const clickSave = (board: HTMLElement) => userEvent.click(board.querySelector('a.board-save')!);
    const clickSettings = (board: HTMLElement) => userEvent.click(board.querySelector('a.board-settings-toggle')!);

    it('can save to a file', async () => {
        const vscode = makeVsCodeHandler();
        let savedCalled = false;
        vscode.save = (kanban) => savedCalled = kanban.saveToFile;

        const wrapper = render(<Board vscode={vscode}/>);
        const board = wrapper.container;
        await wait(5);

        clickSettings(board);
        const saveFileToggle = board.querySelector('a.board-save-file') as HTMLAnchorElement;
        userEvent.click(saveFileToggle);
        clickSave(board);

        expect(savedCalled).toBe(true);
        wrapper.unmount();
    });

    it('has editable text', async () => {
        const vscode = makeVsCodeHandler();
        //save kanban board with 1 column and 1 task
        vscode.save(createStrictKanbanJson('', [createStrictColumnJson('', [createTaskJson()])])); 
        const wrapper = render(<Board vscode={vscode}/>);
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
        vscode.addLoadListener(data => boardData = data);
        vscode.load();
        await wait(5);

        expect(boardData.title).toBe(boardString);
        expect(boardData.cols[0].title).toBe(columnString);
        expect(boardData.cols[0].tasks[0].text).toBe(taskString);

        wrapper.unmount();
    });

    /* Autosave test is skipped since autosaving runs in intervals of 5 sec (which is too long for testing) */

    it ('can add and delete columns', async () => {
        const vscode = makeVsCodeHandler();
        let numCols = 0;
        vscode.addLoadListener(data => numCols = data.cols.length);
        vscode.save(createStrictKanbanJson('', []));
        await wait(5);

        const wrapper = render(<Board vscode={vscode}/>);
        const board = wrapper.container;
        await wait(5);

        //click add column button and save changes
        const addColumnButton = board.querySelector('a.board-add-column') as HTMLAnchorElement;
        userEvent.click(addColumnButton);
        clickSave(board);
        await wait(5);
        vscode.load();
        await wait(5);
        expect(numCols).toBe(1);

        //click remove column button and save changes
        const deleteColumnButton = board.querySelector('a.column-delete') as HTMLAnchorElement;
        userEvent.click(deleteColumnButton);
        clickSave(board);
        await wait(5);
        vscode.load();
        await wait(5);
        expect(numCols).toBe(0);
        wrapper.unmount();
    });


    it('can add and delete tasks', async () => {
        const vscode = makeVsCodeHandler();
        let numTasks = 0;
        vscode.addLoadListener(data => numTasks = data.cols[0].tasks.length);
        vscode.save(createStrictKanbanJson('', [createStrictColumnJson('', [])])); //1 column, 0 tasks
        await wait(5);

        const wrapper = render(<Board vscode={vscode}/>);
        const board = wrapper.container;
        await wait(5);

        //click add task and save changes
        const addTaskButton = board.querySelector('a.column-add-task') as HTMLAnchorElement;
        userEvent.click(addTaskButton);
        clickSave(board);
        await wait(5);
        vscode.load();
        await wait(5);
        expect(numTasks).toBe(1);

        //click delete task and save changes
        const deleteTaskButton = board.querySelector('a.task-delete') as HTMLAnchorElement;
        userEvent.click(deleteTaskButton);
        clickSave(board);
        await wait(5);
        vscode.load();
        await wait(5);
        expect(numTasks).toBe(0);
        wrapper.unmount();
    });

    it("can change a column's color with a color picker", async () => {
        const vscode = makeVsCodeHandler();
        vscode.save(createStrictKanbanJson('', [createStrictColumnJson('', [])])); //1 column, 0 tasks
        await wait(5);

        const wrapper = render(<Board vscode={vscode}/>);
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