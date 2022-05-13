import { createColumnJson, createKanbanJson, createTaskJson, KanbanJson } from './kanban-types';
import VsCodeHandler from './vscode-handler';
import clone from 'just-clone';

/**
 * Enumeration of possible board state changes that can occur.
 */
export enum StateChanges {
    // Board setting changes
    AUTOSAVE,
    SAVE_TO_FILE,
    BOARD_TITLE,

    // Column-specific changes
    COLUMN_ADDED,
    COLUMN_DELETED,
    COLUMN_TITLE,
    COLUMN_COLOR,
    COLUMN_MOVED,

    // Task-specific changes
    TASK_ADDED,
    TASK_DELETED,
    TASK_MOVED,
    TASK_TEXT,

    // Board-wide kanban changes
    HISTORY_REVERSED,
    BOARD_LOADED,
}

export type HistoryObject = {
    change: StateChanges;
    data: KanbanJson;
    details: string;
};

/**
 * Manages the state of a Kanban board. All state modifications should happen through this object, so that it can keep track of them.
 */
class BoardState {
    /**
     * Instantiate Object and load VsCode API if it's available.
     */
    constructor() {
        VsCodeHandler.addLoadListener(this.loadFromVscode);
        VsCodeHandler.load();
    }

    /**
     * Add a callback to be run whenever the current kanban state is changed
     *
     * @param listener callback to be added
     */
    public addKanbanChangeListener(listener: (kanban: KanbanJson) => void) {
        this.kanbanChangeListeners.push(listener);
    }

    /**
     * Remove a callback added with addKanbanChangeListener().
     *
     * @param listener callback to be removed
     */
    public removeKanbanChangeListener(listener: (kanban: KanbanJson) => void) {
        this.kanbanChangeListeners = this.kanbanChangeListeners.filter((l) => l !== listener);
    }

    /**
     * Run all kanban-change listeners.
     */
    public refreshKanban() {
        this.kanbanChangeListeners.forEach((listener) => listener(this.currentKanban));
    }

    /**
     * Add a callback to be run whenever the change history is updated.
     *
     * @param listener callback to be added
     */
    public addHistoryUpdateListener(listener: (history: HistoryObject) => void) {
        this.historyUpdateListeners.push(listener);
    }

    /**
     * Remove a callback added with addHistoryUpdateListener().
     *
     * @param listener callback to be removed
     */
    public removeHistoryUpdateListener(listener: (history: HistoryObject) => void) {
        this.historyUpdateListeners = this.historyUpdateListeners.filter((l) => l !== listener);
    }

    /**
     * @returns a copy of this BoardState's history list
     */
    public getHistory() {
        //TODO: change to readonly reference
        return clone(this.history);
    }

    /**
     * Sets the autosave field of the current board state to newAutosave
     *
     * @param newAutosave desired autosave value for current board state
     */
    public setAutosave(newAutosave: boolean): void {
        if (newAutosave === this.currentKanban.autosave) {
            return;
        }

        this.history.push({
            change: StateChanges.AUTOSAVE,
            data: clone(this.currentKanban),
            details: `Autosave turned ${newAutosave ? 'on' : 'off'}.`,
        });
        this.currentKanban.autosave = newAutosave;
        this.endChange(true);
    }

    /**
     * Sets the saveToFile field of the current board state to newSaveToFile
     *
     * @param newSaveToFile desired saveToFile value for current board state
     */
    public setSaveToFile(newSaveToFile: boolean): void {
        if (newSaveToFile === this.currentKanban.saveToFile) {
            return;
        }

        this.history.push({
            change: StateChanges.SAVE_TO_FILE,
            data: clone(this.currentKanban),
            details: `Will save to ${newSaveToFile ? 'file' : 'workspace'}.`,
        });
        this.currentKanban.saveToFile = newSaveToFile;
        this.endChange(true);
    }

    /**
     * Sets the title filed of the current board state to newTitle.
     *
     * By design, it takes a second for this change to be registered
     * in the Board State's change history.
     *
     * @param newTitle desired title for current board state
     */
    public setBoardTitle(newTitle: string): void {
        const oldTitle = this.currentKanban.title;
        if (oldTitle === newTitle) {
            return;
        }
        this.history.push({
            change: StateChanges.BOARD_TITLE,
            data: clone(this.currentKanban),
            details: `From "${oldTitle}" to "${newTitle}"`,
        });
        this.currentKanban.title = newTitle;
        this.endChange(true);
    }

    /**
     * Appends a column to the current board state's column list.
     */
    public addColumn(): void {
        const columnName = `Column ${this.currentKanban.cols.length + 1}`;
        const column = createColumnJson(columnName);

        this.currentKanban.cols.push(column);
        this.endChange(false);
    }

    /**
     * Removes a column with the given id from the current board state.
     *
     * @param id ID of column to remove
     */
    public removeColumn(id: string): void {
        const columnIdx = this.getColumnIndex(id);
        if (columnIdx === -1) {
            return;
        }

        this.history.push({
            change: StateChanges.COLUMN_DELETED,
            data: clone(this.currentKanban),
            details: `Deleted "${this.currentKanban.cols[columnIdx].title}"`,
        });

        this.currentKanban.cols.splice(columnIdx, 1);
        this.endChange(true);
    }

    /**
     * Changes the title of the column with the given id.
     *
     * By design, this change takes a second to register in the board state's
     * change history.
     *
     * @param id ID of column to edit
     * @param newTitle desired title of column
     */
    public setColumnTitle(id: string, newTitle: string) {
        const columnIdx = this.getColumnIndex(id);
        if (columnIdx === -1) {
            return;
        }

        const column = this.currentKanban.cols[columnIdx];
        const oldTitle = column.title;

        if (oldTitle === newTitle) {
            return;
        }

        this.history.push({
            change: StateChanges.COLUMN_TITLE,
            data: clone(this.currentKanban),
            details: `From "${oldTitle}" to "${newTitle}"`,
        });
        column.title = newTitle;
        this.endChange(true);
    }

    /**
     * Changes the color of the column with the given id.
     *
     * @param id ID of column to edit
     * @param newColor desired color  of column
     */
    public setColumnColor(id: string, newColor: string) {
        const columnIdx = this.getColumnIndex(id);
        if (columnIdx === -1) {
            return;
        }

        const column = this.currentKanban.cols[columnIdx];
        if (column.color === newColor) {
            return;
        }

        this.history.push({
            change: StateChanges.COLUMN_COLOR,
            data: clone(this.currentKanban),
            details: `"${column.title}" color changed`,
        });

        this.currentKanban.cols[columnIdx].color = newColor;
        this.endChange(true);
    }

    /**
     * Changes the position of the column with the given id to a
     * specified index in the current board state's column list.
     * Other columns will be shifted accommodate this movement.
     *
     * @param id ID of column to move
     * @param toIndex desired index of column
     */
    public moveColumn(id: string, toIndex: number) {
        if (toIndex < 0 || toIndex >= this.currentKanban.cols.length) {
            return;
        }

        const columnIdx = this.getColumnIndex(id);
        if (columnIdx === -1) {
            return;
        }

        this.history.push({
            change: StateChanges.COLUMN_MOVED,
            data: clone(this.currentKanban),
            details: `"${this.currentKanban.cols[columnIdx].title}" moved`,
        });

        const [column] = this.currentKanban.cols.splice(columnIdx, 1);
        this.currentKanban.cols.splice(toIndex, 0, column);
        this.endChange(true);
    }

    /**
     * Append's a task to the task list of the column with the given id.
     *
     * @param columnId ID of the column to add a task to
     * @returns the ID of the newly created task
     */
    public addTask(columnId: string): string {
        const columnIdx = this.getColumnIndex(columnId);
        if (columnIdx === -1) {
            return '';
        }

        const newTask = createTaskJson();
        this.currentKanban.cols[columnIdx].tasks.splice(0, 0, newTask);
        this.endChange(false);
        return newTask.id;
    }

    /**
     * Removes a task with the specified ID from the column with the given ID.
     *
     * @param columnId ID of column containing task to remove
     * @param taskId ID of task to remove
     */
    public removeTask(columnId: string, taskId: string): void {
        const columnIdx = this.getColumnIndex(columnId);
        if (columnIdx === -1) {
            return;
        }
        const column = this.currentKanban.cols[columnIdx];

        const taskIdx = column.tasks.findIndex((t) => t.id === taskId);
        if (taskIdx === -1) {
            return;
        }
        const task = column.tasks[taskIdx];
        const taskEmpty = task.text === '';

        if (!taskEmpty) {
            this.history.push({
                change: StateChanges.TASK_DELETED,
                data: clone(this.currentKanban),
                details: `"${task.text}" removed from "${column.title}"`,
            });
        }

        this.currentKanban.cols[columnIdx].tasks.splice(taskIdx, 1);
        this.endChange(!taskEmpty);
    }

    /**
     * Moves a task from one column and/or position to another column and/or position.
     *
     * sourceCol can equal destCol.
     *
     * @param sourceCol ID of column already containing task
     * @param destCol ID of column task should be moved to
     * @param sourceIndex starting position of task in SourceCol's task list
     * @param destIndex desired position in destCol's task list
     */
    public moveTask(
        sourceCol: string,
        destCol: string,
        sourceIndex: number,
        destIndex: number
    ): void {
        const sourceColIdx = this.getColumnIndex(sourceCol);
        const destColIdx = this.getColumnIndex(destCol);
        if (sourceColIdx === -1 || destColIdx === -1) {
            return;
        }

        const numSourceTasks = this.currentKanban.cols[sourceColIdx].tasks.length;
        const numDestTasks = this.currentKanban.cols[destColIdx].tasks.length;

        const destTooBig = // if destCol === sourceCol then task cannot be appended to end of list
            destCol === sourceCol ? destIndex >= numDestTasks : destIndex > numDestTasks;
        if (sourceIndex < 0 || sourceIndex >= numSourceTasks || destIndex < 0 || destTooBig) {
            return;
        }

        const [task] = this.currentKanban.cols[sourceColIdx].tasks.splice(sourceIndex, 1);
        this.currentKanban.cols[destColIdx].tasks.splice(destIndex, 0, task);

        this.endChange(false);
    }

    /**
     * Rolls back the current state to the state found at changeHistory[index].
     * @param index index into BoardState's change history that the current state should be rolled back to
     */
    public rollBackHistory(index: number) {
        if (index < 0 || index >= this.history.length) {
            return;
        }

        this.history.push({
            change: StateChanges.HISTORY_REVERSED,
            data: clone(this.currentKanban),
            details: `Changes reversed to item ${index + 1}`,
        });

        const newKanban = clone(this.history[index].data);
        this.currentKanban = newKanban;

        this.endChange(true);
    }

    /**
     * Save a given StrictKanbanJSON or, if no kanban is provided, the BoardStates' current state.
     * @param kanban StrictKanbanJSON to save
     */
    public save(kanban: KanbanJson | null = null) {
        if (kanban) {
            this.history.push({
                change: StateChanges.BOARD_LOADED,
                data: clone(this.currentKanban),
                details: '',
            });

            this.currentKanban = clone(kanban);
            this.historyUpdateListeners.forEach((listener) =>
                listener(this.history[this.history.length - 1])
            );
            this.refreshKanban();
        }

        this.hasChangedSinceSave = false;
        VsCodeHandler.save(this.currentKanban);
    }

    /**
     * @returns a copy of the BoardState's current state
     */
    public getCurrentState() {
        return clone(this.currentKanban);
    }

    /**
     * Make the kanban-change listeners load a given StrictKanbanJSON
     * @param kanban StrictKanbanJSON to load
     */
    public displayKanban(kanban: KanbanJson) {
        this.kanbanChangeListeners.forEach((listener) => listener(kanban));
    }

    get changedSinceSave() {
        return this.hasChangedSinceSave;
    }

    /**
     * Change a task's text.
     *
     * By design, it takes a second for this change to register in
     * the BoardState's change history.
     *
     * @param columnId ID of column containing task to edit
     * @param taskId ID of task to edit
     * @param newText desired text of the task
     */
    public setTaskText(
        columnId: string,
        columnIndex: number,
        taskId: string,
        taskIndex: number,
        newText: string
    ) {
        if (columnIndex < 0 || columnIndex >= this.currentKanban.cols.length) {
            return false;
        }
        const column = this.currentKanban.cols[columnIndex];

        if (column.id !== columnId || taskIndex < 0 || taskIndex >= column.tasks.length) {
            return false;
        }

        const task = column.tasks[taskIndex];

        if (task.id !== taskId) {
            return false;
        }

        const oldText = task.text;
        let oldTextDisplay = oldText;
        if (oldText.length > 20) {
            oldTextDisplay = `${oldText.slice(0, 9)}...${oldText.slice(-9)}`;
        }

        let newTextDisplay = newText;
        if (newText.length > 20) {
            newTextDisplay = `${newText.slice(0, 9)}...${newText.slice(-9)}`;
        }

        const updateHistory = oldText.length !== 0 && oldText !== newText;
        if (updateHistory) {
            this.history.push({
                change: StateChanges.TASK_TEXT,
                data: clone(this.currentKanban),
                details: `"${oldTextDisplay}" changed to "${newTextDisplay}"`,
            });
        }

        task.text = newText;
        this.endChange(updateHistory);
        return true;
    }

    /*******************
     * Private Methods *
     *******************/
    private currentKanban = createKanbanJson();
    private kanbanChangeListeners: Array<(kanban: KanbanJson) => void> = [];
    private historyUpdateListeners: Array<(historyStep: HistoryObject) => void> = [];

    private history: HistoryObject[] = [];

    private loadFromVscode = (kanban: KanbanJson) => {
        this.currentKanban = kanban;
        this.refreshKanban();
    };

    private getColumnIndex(columnId: string): number {
        return this.currentKanban.cols.findIndex((col) => col.id === columnId);
    }

    private endChange(updateHistory: boolean) {
        this.hasChangedSinceSave = true;

        if (this.currentKanban.autosave) {
            this.save();
        }

        if (updateHistory) {
            this.historyUpdateListeners.forEach((listener) =>
                listener(this.history[this.history.length - 1])
            );
        }

        this.refreshKanban();
    }

    private hasChangedSinceSave = false;
}

export default new BoardState();
