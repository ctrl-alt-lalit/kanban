import { render } from '@testing-library/react';
import Board from '../../components/board';
import { createStrictColumnJson, createStrictKanbanJson, createTaskJson } from '../../util/kanban-type-functions';
import userEvent from '@testing-library/user-event';
import boardState from '../../util/board-state';
import { randStr } from '../helpers';


function* boardSetup() {
    const wrapper = render(<Board />);
    const board = wrapper.container;
    yield board;

    wrapper.unmount();
}

const clickSave = (board: HTMLElement) => userEvent.click(board.querySelector('a.board-save')!);
const clickSettings = (board: HTMLElement) => userEvent.click(board.querySelector('a.board-settings-toggle')!);

const clickColumnSettings = (board: HTMLElement) => {
    const columnSettings = board.querySelector('a.column-settings-toggle') as HTMLAnchorElement;
    userEvent.click(columnSettings);
};

describe('Board, Column, and Task', () => {

    it('renders data in a StrictKanbanJSON', async () => {
        const data = createStrictKanbanJson(
            randStr(),
            [
                createStrictColumnJson(
                    randStr(),
                    [
                        createTaskJson(randStr()),
                        createTaskJson(randStr()),
                        createTaskJson(randStr())
                    ],
                    '#000000' //variable color names don't work in test, but do work in production
                ),
                createStrictColumnJson(
                    randStr(),
                    [createTaskJson()],
                    '#ff00ff'
                ),
                createStrictColumnJson(
                    randStr(),
                    [],
                    '#f0f0f0'
                )
            ],
            (Math.random() < 0.5)
        );

        //initialize board and wait for data to load
        boardState.save(data);
        const it = boardSetup();
        const board = it.next().value!;


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

        it.return();
    });

    it('can save its state', async () => {
        const it = boardSetup();
        const board = it.next().value!;


        const time1 = boardState.getCurrentState().timestamp;

        clickSave(board);
        const time2 = boardState.getCurrentState().timestamp;
        expect(time2).toBeGreaterThan(time1);

        userEvent.type(board, '{ctrl}s');
        const time3 = boardState.getCurrentState().timestamp;
        expect(time3).toBeGreaterThan(time2);

        it.return();
    });

    it('can autosave', async () => {
        const it = boardSetup();
        const board = it.next().value!;


        boardState.save(createStrictKanbanJson());
        expect(boardState.getCurrentState().autosave).toBe(false);

        clickSettings(board);
        const autosaveButton = board.querySelector('a.board-autosave')!;
        userEvent.click(autosaveButton);

        expect(boardState.getCurrentState().autosave).toBe(true);

        it.return();
    });

    it('can save to a file', async () => {
        const it = boardSetup();
        const board = it.next().value!;


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
        const it = boardSetup();
        const board = it.next().value!;


        //edit task
        const task = board.querySelector('div.task') as HTMLDivElement;
        const taskDisplay = task.querySelector('div.task-display') as HTMLDivElement;
        userEvent.click(taskDisplay);
        const taskEdit = task.querySelector('textarea.task-edit') as HTMLTextAreaElement;
        userEvent.dblClick(taskEdit);
        const taskString = randStr();
        userEvent.type(taskEdit, taskString);

        //edit column title
        const columnTitle = board.querySelector('input.column-title') as HTMLInputElement;
        userEvent.dblClick(columnTitle);
        const columnString = randStr();
        userEvent.type(columnTitle, columnString);

        //edit board title
        const boardTitle = board.querySelector('input.board-title') as HTMLInputElement;
        userEvent.dblClick(boardTitle);
        const boardString = randStr();
        userEvent.type(boardTitle, boardString);

        //save changes and get current board state
        clickSave(board);

        let boardData = createStrictKanbanJson();
        const listener: (kanban: StrictKanbanJSON) => void = kanban => boardData = kanban;
        boardState.addKanbanChangeListener(listener);
        boardState.refresh();



        expect(boardData.title).toBe(boardString);
        expect(boardData.cols[0].title).toBe(columnString);
        expect(boardData.cols[0].tasks[0].text).toBe(taskString);

        boardState.removeKanbanChangeListener(listener);
        it.return();
    });

    it('can open the Revision History panel', async () => {
        const it = boardSetup();
        const board = it.next().value!;


        const listener = jest.fn();
        window.addEventListener('open-history', listener);

        const historyToggle = board.querySelector('a.board-history-open')!;
        userEvent.click(historyToggle);


        expect(listener).toHaveBeenCalled();
        window.removeEventListener('open-history', listener);

        it.return();
    });

    /* Autosave test is skipped since autosaving runs in intervals of 5 sec (which is too long for testing) */

    it('can add and delete columns', async () => {
        let numCols = 0;
        const listener: (kanban: StrictKanbanJSON) => void = kanban => numCols = kanban.cols.length;

        boardState.addKanbanChangeListener(listener);
        boardState.save(createStrictKanbanJson('', []));


        const it = boardSetup();
        const board = it.next().value!;

        //click add column button and save changes
        const addColumnButton = board.querySelector('a.board-add-column') as HTMLAnchorElement;
        userEvent.click(addColumnButton);

        expect(numCols).toBe(1);

        //click remove column button and save changes
        clickColumnSettings(board);
        const deleteColumnButton = board.querySelector('a.column-delete') as HTMLAnchorElement;
        userEvent.click(deleteColumnButton);


        expect(numCols).toBe(0);

        boardState.removeKanbanChangeListener(listener);
        it.return();
    });


    it('can add and delete tasks', async () => {
        let numTasks = 0;
        const listener: (kanban: StrictKanbanJSON) => void = kanban => numTasks = kanban.cols[0].tasks.length;

        boardState.addKanbanChangeListener(listener);
        boardState.save(createStrictKanbanJson('', [createStrictColumnJson('', [])])); //1 column, 0 tasks


        const it = boardSetup();
        const board = it.next().value!;


        //click add task and save changes
        const addTaskButton = board.querySelector('a.column-add-task') as HTMLAnchorElement;
        userEvent.click(addTaskButton);

        expect(numTasks).toBe(1);

        //click delete task and save changes
        const deleteTaskButton = board.querySelector('a.task-delete') as HTMLAnchorElement;
        userEvent.click(deleteTaskButton);

        expect(numTasks).toBe(0);

        boardState.removeKanbanChangeListener(listener);
        it.return();
    });

    it("can change a column's color with a color picker", () => {
        boardState.save(createStrictKanbanJson('', [createStrictColumnJson('', [])])); //1 column, 0 tasks


        const it = boardSetup();
        const board = it.next().value!;

        clickColumnSettings(board);

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
        it.return();
    });

    it('can open a context menu over a column', async () => {
        boardState.save(createStrictKanbanJson('', [createStrictColumnJson('', [])]));

        const it = boardSetup();
        const board = it.next().value!;

        const column = board.querySelector('div.column') as HTMLDivElement;
        let menu = column.querySelector('.szh-menu');
        expect(menu).toBeNull();

        userEvent.click(column, { button: 2 }); //right click
        menu = column.querySelector('.szh-menu');
        expect(menu).not.toBeNull();
    });

    it("has functional buttons in a column's context menu", () => {
        boardState.save(createStrictKanbanJson('', [createStrictColumnJson('', [])]));

        const it = boardSetup();
        const board = it.next().value!;

        const column = board.querySelector('div.column') as HTMLDivElement;
        userEvent.click(column, { button: 2 });
        const menu = column.querySelector('.szh-menu') as HTMLUListElement;

        const [addTask, deleteColumn] = Array.from(menu.children);

        const addTaskSpy = jest.spyOn(boardState, 'addTask');
        const removeColumnSpy = jest.spyOn(boardState, 'removeColumn');

        userEvent.click(addTask);
        expect(addTaskSpy).toHaveBeenCalled();

        userEvent.click(deleteColumn);
        expect(removeColumnSpy).toHaveBeenCalled();
    });
});