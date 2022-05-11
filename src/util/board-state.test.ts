import clone from 'just-clone';
import boardState from '../util/board-state';
import { createColumnJson, createKanbanJson, createTaskJson, KanbanJson } from './kanban-types';
import { randomInteger, randomString } from './test-helpers';
import VsCodeHandler from './vscode-handler';

function histLen() {
    return boardState.getHistory().length;
}

function kbEqual(actual: any, expected: any) {
    expect(actual.cols).toEqual(expected.cols);
    expect(actual.autosave).toEqual(expected.autosave);
    expect(actual.saveToFile).toEqual(expected.saveToFile);
    expect(actual.title).toEqual(expected.title);
}

describe('Board State', () => {
    const originalKanban = createKanbanJson('blah', [
        createColumnJson('col1', [createTaskJson('blah'), createTaskJson()]),
        createColumnJson(),
    ]);
    const originalColumn = originalKanban.cols[0];
    const originalTask = originalColumn.tasks[0];

    describe('Kanban change listeners', () => {
        const listener = jest.fn();

        it('can add a listener', () => {
            const spy = jest.spyOn(Array.prototype as any, 'push');

            boardState.addKanbanChangeListener(listener);
            expect(spy).toHaveBeenCalled();
            spy.mockClear();
        });

        it('can call listeners', () => {
            boardState.refreshKanban();
            expect(listener).toHaveBeenCalled();
            listener.mockClear();
        });

        it('can remove listeners', () => {
            boardState.removeKanbanChangeListener(listener);
            boardState.refreshKanban();

            expect(listener).not.toHaveBeenCalled();
        });
    });

    describe('History listeners', () => {
        const listener = jest.fn();

        beforeAll(() => boardState.save(originalKanban));

        it('can add a listener', () => {
            const spy = jest.spyOn(Array.prototype as any, 'push');

            boardState.addHistoryUpdateListener(listener);
            expect(spy).toHaveBeenCalled();
            spy.mockClear();
        });

        it('can call listeners', () => {
            boardState.removeColumn(originalKanban.cols[0].id);
            expect(listener).toHaveBeenCalled();
            listener.mockClear();
        });

        it('can remove listeners', () => {
            boardState.removeHistoryUpdateListener(listener);
            boardState.removeColumn(originalKanban.cols[0].id);

            expect(listener).not.toHaveBeenCalled();
        });

        afterAll(() => boardState.save(originalKanban));
    });

    describe('changeAutosave()', () => {
        it("changes a board's autosave state", () => {
            const newAutosave = !boardState.getCurrentState().autosave;
            boardState.setAutosave(newAutosave);
            expect(boardState.getCurrentState().autosave).toEqual(newAutosave);
        });

        it('does not add anything to revision history', () => {
            const oldHistoryLength = histLen();
            boardState.setAutosave(!boardState.getCurrentState().autosave);
            expect(histLen()).toEqual(oldHistoryLength);
        });
    });

    describe('changeSaveToFile()', () => {
        it("changes a board's save-to-file status", () => {
            const newSTF = !boardState.getCurrentState().saveToFile;
            boardState.setSaveToFile(newSTF);
            expect(boardState.getCurrentState().saveToFile).toEqual(newSTF);
        });

        it('does not add anything to revision history', () => {
            const oldHistoryLength = histLen();
            boardState.setSaveToFile(!boardState.getCurrentState().saveToFile);
            expect(histLen()).toEqual(oldHistoryLength);
        });
    });

    describe('changeBoardTitle()', () => {
        it("changes a board's title", () => {
            const newTitle = randomString();
            boardState.setBoardTitle(newTitle);
            expect(boardState.getCurrentState().title).toEqual(newTitle);
        });

        it('adds to revision history', () => {
            const oldHistoryLength = histLen();
            boardState.setBoardTitle(randomString());
            expect(histLen()).toEqual(oldHistoryLength + 1);
        });
    });

    describe('addColumn()', () => {
        it('adds a column to the board', () => {
            const oldNumCols = boardState.getCurrentState().cols.length;
            boardState.addColumn();
            expect(boardState.getCurrentState().cols.length).toEqual(oldNumCols + 1);
        });

        it('does not add to revision history', () => {
            const oldHistoryLength = histLen();
            boardState.addColumn();
            expect(histLen()).toEqual(oldHistoryLength);
        });

        afterAll(() => boardState.save(originalKanban));
    });

    describe('removeColumn()', () => {
        it('removes a column from the board', () => {
            const columnId = boardState.getCurrentState().cols[0].id;
            const oldNumCols = boardState.getCurrentState().cols.length;

            boardState.removeColumn(columnId);
            expect(boardState.getCurrentState().cols.length).toEqual(oldNumCols - 1);
        });

        it("does nothing if the column doesn't exist", () => {
            const oldState = boardState.getCurrentState();
            boardState.removeColumn('bad');
            expect(boardState.getCurrentState()).toEqual(oldState);
        });

        it('adds to revision history', () => {
            const oldHistoryLength = histLen();
            boardState.removeColumn(boardState.getCurrentState().cols[0].id);
            expect(histLen()).toEqual(oldHistoryLength + 1);
        });

        afterAll(() => boardState.save(originalKanban));
    });

    describe('changeColumnTitle()', () => {
        it("changes a column's title", () => {
            const newTitle = randomString();

            boardState.setColumnTitle(originalColumn.id, newTitle);
            expect(boardState.getCurrentState().cols[0].title).toEqual(newTitle);
        });

        it('adds to revision history', () => {
            const oldHistoryLength = histLen();
            boardState.setColumnTitle(originalColumn.id, randomString());
            expect(histLen()).toEqual(oldHistoryLength + 1);
        });

        it("does nothing if the column doesn't exist", () => {
            const oldState = boardState.getCurrentState();
            boardState.setColumnTitle('bad', randomString());
            expect(oldState).toEqual(boardState.getCurrentState());
        });

        afterAll(() => boardState.save(originalKanban));
    });

    describe('changeColumnColor()', () => {
        it("changes a column's color", () => {
            const newColor = randomString();
            boardState.setColumnColor(originalColumn.id, newColor);
            expect(boardState.getCurrentState().cols[0].color).toEqual(newColor);
        });

        it("does nothing if the column doesn't exist", () => {
            const oldState = boardState.getCurrentState();
            boardState.setColumnColor('bad', randomString());
            expect(boardState.getCurrentState()).toEqual(oldState);
        });

        it('does nothing if newColor is the same as the old color', () => {
            const oldState = boardState.getCurrentState();
            const oldColor = oldState.cols[0].color;

            boardState.setColumnColor(originalColumn.id, oldColor);
            expect(boardState.getCurrentState()).toEqual(oldState);
        });

        it('adds to revision history', () => {
            const oldHistoryLength = histLen();
            boardState.setColumnColor(originalColumn.id, randomString());
            expect(histLen()).toEqual(oldHistoryLength + 1);
        });

        afterAll(() => boardState.save(originalKanban));
    });

    describe('moveColumn()', () => {
        it('moves a column in a kanban board', () => {
            const swappedKanban = clone(originalKanban);
            const tmp = swappedKanban.cols[0];
            swappedKanban.cols[0] = swappedKanban.cols[1];
            swappedKanban.cols[1] = tmp;

            boardState.save(originalKanban);
            boardState.moveColumn(tmp.id, 1);

            kbEqual(boardState.getCurrentState(), swappedKanban);
        });

        it('sanity checks inputs', () => {
            boardState.save(originalKanban);
            const column = originalKanban.cols[0];

            boardState.moveColumn(column.id, -1);
            boardState.moveColumn(column.id, 10);
            boardState.moveColumn('nonexistent', 0);

            kbEqual(boardState.getCurrentState(), originalKanban);
        });

        afterAll(() => boardState.save(originalKanban));
    });

    describe('addTask()', () => {
        it('adds a task to a column', () => {
            boardState.addTask(originalColumn.id);
            expect(boardState.getCurrentState().cols[0].tasks.length).toEqual(
                originalColumn.tasks.length + 1
            );
        });

        it("does nothing if the column doesn't exist", () => {
            const oldState = boardState.getCurrentState();
            boardState.addTask('bad');
            expect(boardState.getCurrentState()).toEqual(oldState);
        });

        it('does not add to revision history', () => {
            const oldHistoryLength = histLen();
            boardState.addTask(originalColumn.id);
            expect(histLen()).toEqual(oldHistoryLength);
        });

        afterAll(() => boardState.save(originalKanban));
    });

    describe('removeTask()', () => {
        afterEach(() => boardState.save(originalKanban));

        it('removes a task', () => {
            boardState.removeTask(originalColumn.id, originalTask.id);
            expect(boardState.getCurrentState().cols[0].tasks.length).toEqual(
                originalColumn.tasks.length - 1
            );
        });

        it("does not remove a task if the taskId doesn't exist", () => {
            boardState.removeTask(originalColumn.id, 'bad');
            kbEqual(boardState.getCurrentState(), originalKanban);
        });

        it("does not remove a task if the columnId doesn't exist", () => {
            boardState.removeTask('bad', originalTask.id);
            kbEqual(boardState.getCurrentState(), originalKanban);
        });

        it('adds to revision history if a task has text', () => {
            const oldHistoryLength = histLen();
            boardState.removeTask(originalColumn.id, originalTask.id);
            expect(histLen()).toEqual(oldHistoryLength + 1);
        });

        it('does not add to revision history if the task has no text', () => {
            const oldHistoryLength = histLen();
            boardState.removeTask(originalColumn.id, originalColumn.tasks[1].id);
            expect(histLen()).toEqual(oldHistoryLength);
        });
    });

    describe('moveTask()', () => {
        afterEach(() => boardState.save(originalKanban));

        it('moves a task from one position to another in the same column', () => {
            const column = originalKanban.cols[0];

            const oldSecondId = column.tasks[1].id;
            boardState.moveTask(column.id, column.id, 1, 0);

            expect(boardState.getCurrentState().cols[0].tasks[0].id).toEqual(oldSecondId);
        });

        it('moves a task from one column to another', () => {
            const [sourceId, destId] = [originalKanban.cols[0].id, originalKanban.cols[1].id];
            const task = originalKanban.cols[0].tasks[0];

            boardState.moveTask(sourceId, destId, 0, 0);
            expect(boardState.getCurrentState().cols[1].tasks[0]).toEqual(task);
        });

        it('checks for valid parameters', () => {
            boardState.moveTask('bad', 'bad', 0, 1);
            const column = originalKanban.cols[0];
            boardState.moveTask(column.id, column.id, -1, 1000);
        });
    });

    describe('changeTaskText()', () => {
        afterEach(() => boardState.save(originalKanban));

        it('checks for valid IDs and Indices', () => {
            //bad column index
            expect(
                boardState.setTaskText(originalColumn.id, -1, originalTask.id, 0, 'blah')
            ).toEqual(false);

            //bad task index
            expect(
                boardState.setTaskText(originalColumn.id, 0, originalTask.id, -1, 'blah')
            ).toEqual(false);

            //bad column id
            expect(boardState.setTaskText('bad', 0, originalTask.id, 0, 'blah')).toEqual(false);

            //bad task id
            expect(boardState.setTaskText(originalColumn.id, 0, 'bad', 0, 'blah')).toEqual(false);
        });

        it("changes the task's text", () => {
            const newText = randomString();

            expect(
                boardState.setTaskText(originalColumn.id, 0, originalTask.id, 0, newText)
            ).toEqual(true);

            expect(boardState.getCurrentState().cols[0].tasks[0].text).toEqual(newText);
        });
    });

    describe('undoChange()', () => {
        afterEach(() => boardState.save(originalKanban));

        it('reverts a kanban to a previous point in revision history', () => {
            const index = randomInteger(histLen());
            const oldState = boardState.getHistory()[index].data;
            boardState.rollBackHistory(index);
            kbEqual(boardState.getCurrentState(), oldState);
        });

        it('does nothing if the provided index is out of bounds', () => {
            boardState.rollBackHistory(-1);
            boardState.rollBackHistory(histLen());
            kbEqual(boardState.getCurrentState(), originalKanban);
        });
    });

    describe('save()', () => {
        it('saves the board to VsCode', () => {
            const spy = jest.spyOn(VsCodeHandler.prototype as any, 'save');

            boardState.save();
            expect(spy).toHaveBeenCalled();
            spy.mockClear();
        });
    });

    describe('forceReload()', () => {
        it('makes change listeners load a specified kanban board', () => {
            let result = originalKanban;
            const listener = (kanban: KanbanJson) => (result = kanban);
            boardState.addKanbanChangeListener(listener);

            const newData = createKanbanJson();
            boardState.displayKanban(newData);

            expect(result).toEqual(newData);
        });
    });
});
