import clone from "just-clone";
import boardState from "../../util/board-state";
import { createStrictColumnJson, createStrictKanbanJson, createTaskJson } from "../../util/kanban-type-functions";

describe('Board State', () => {
    const originalData = createStrictKanbanJson(
        'blah',
        [
            createStrictColumnJson('col1', [createTaskJson(), createTaskJson()]),
            createStrictColumnJson()
        ]
    );

    describe('moveTask()', () => {

        beforeEach(() => boardState.save(originalData));

        it('moves a task from one position to another in the same column', () => {
            const column = originalData.cols[0];

            const oldSecondId = column.tasks[1].id;
            boardState.moveTask(column.id, column.id, 1, 0);

            expect(boardState.getCurrentState().cols[0].tasks[0].id).toEqual(oldSecondId);
        });

        it('moves a task from one column to another', () => {
            const [sourceId, destId] = [originalData.cols[0].id, originalData.cols[1].id];
            const task = originalData.cols[0].tasks[0];

            boardState.moveTask(sourceId, destId, 0, 0);
            expect(boardState.getCurrentState().cols[1].tasks[0]).toEqual(task);
        });

        it('checks for valid parameters', () => {
            boardState.moveTask('bad', 'bad', 0, 1);
            const column = originalData.cols[0];
            boardState.moveTask(column.id, column.id, -1, 1000);
        });
    });

    describe('fakeRefresh()', () => {
        it('makes change listeners load a specified kanban board', () => {
            let result = originalData;
            const listener = (kanban: StrictKanbanJSON) => result = kanban;
            boardState.addKanbanChangeListener(listener);

            const newData = createStrictKanbanJson();
            boardState.fakeRefresh(newData);

            expect(result).toEqual(newData);
        });
    });

    describe('moveColumn()', () => {
        it('moves a column in a kanban board', () => {
            const swappedKanban = clone(originalData);
            const tmp = swappedKanban.cols[0];
            swappedKanban.cols[0] = swappedKanban.cols[1];
            swappedKanban.cols[1] = tmp;

            boardState.save(originalData);
            boardState.moveColumn(tmp.id, 1);

            expect(boardState.getCurrentState().cols).toEqual(swappedKanban.cols); //do not expect equal timestamps
        });

        it('sanity checks inputs', () => {
            boardState.save(originalData);
            const column = originalData.cols[0];

            boardState.moveColumn(column.id, -1);
            boardState.moveColumn(column.id, 10);
            boardState.moveColumn('nonexistent', 0);

            expect(boardState.getCurrentState()).toEqual(originalData);
        });
    });

    it('Does not change the kanban board if a function has bad parameters', () => {
        boardState.save(originalData);

        boardState.changeAutosave(originalData.autosave);
        boardState.changeSaveToFile(originalData.saveToFile);
        boardState.changeBoardTitle(originalData.title);

        const badId = "doesn't exist";
        boardState.removeColumn(badId);

        const column = originalData.cols[0];
        boardState.changeColumnTitle(badId, "new title");
        boardState.changeColumnTitle(column.id, column.title);

        boardState.changeColumnColor(badId, 'blue');
        boardState.changeColumnColor(column.id, column.color);

        boardState.addTask(badId);

        const task = column.tasks[0];
        boardState.removeTask(badId, task.id);
        boardState.removeTask(column.id, badId);

        boardState.changeTaskText(badId, task.id, "text");
        boardState.changeTaskText(column.id, badId, "text");
        boardState.changeTaskText(column.id, task.id, task.text);

        boardState.reverseHistory(-1);

        expect(boardState.getCurrentState()).toEqual(originalData);
    });

});