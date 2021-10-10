import { createStrictColumnJson, createStrictKanbanJson, createTaskJson } from "./kanban-type-functions";
import VsCodeHandler from "./vscode-handler";
import clone from 'just-clone';
declare var acquireVsCodeApi: () => VsCodeApi;

export enum StateChanges {
    AUTOSAVE,
    SAVE_TO_FILE,
    BOARD_TITLE,

    COLUMN_ADDED,
    COLUMN_DELETED,
    COLUMN_TITLE,
    COLUMN_COLOR,

    TASK_ADDED,
    TASK_DELETED,
    TASK_MOVED,
    TASK_TEXT,

    HISTORY_REVERSED
}

export type HistoryObject = { change: StateChanges, data: StrictKanbanJSON, details: string };

class DelayedUpdater {
    constructor(msDelay: number) {
        this.delay = msDelay;
    }

    public tryUpdate(callback: () => void, timeoutKey: string) {
        if (this.timeoutMap.has(timeoutKey)) {
            const oldTimeout = this.timeoutMap.get(timeoutKey)!;
            clearTimeout(oldTimeout);
        }

        const timeout = setTimeout(callback, this.delay);
        this.timeoutMap.set(timeoutKey, timeout);
    }

    private delay: number;
    private timeoutMap: Map<string, NodeJS.Timeout> = new Map();
}

class BoardState {
    constructor() {
        let vscodeApi: VsCodeApi | null = null;
        if (typeof acquireVsCodeApi === 'undefined') {
            vscodeApi = {
                postMessage: () => { return; }
            };
        } else {
            vscodeApi = acquireVsCodeApi();
        }

        this.vscodeHandler = new VsCodeHandler(vscodeApi);
        this.vscodeHandler.addLoadListener(this.loadFromVscode);
        this.vscodeHandler.load();
    }

    public addKanbanChangeListener(listener: (kanban: StrictKanbanJSON) => void) {
        this.kanbanChangeListeners.push(listener);
    }

    public removeKanbanChangeListener(listener: (kanban: StrictKanbanJSON) => void) {
        this.kanbanChangeListeners = this.kanbanChangeListeners.filter(l => l !== listener);
    }

    public addHistoryUpdateListener(listener: (history: HistoryObject) => void) {
        this.historyUpdateListeners.push(listener);
    }

    public removeHistoryUpdateListener(listener: (history: HistoryObject) => void) {
        this.historyUpdateListeners = this.historyUpdateListeners.filter(l => l !== listener);
    }

    public refresh() {
        this.kanbanChangeListeners.forEach(listener => listener(this.currentKanban));
    }

    public getHistory() {
        return [...this.history];
    }

    public changeAutosave(newAutosave: boolean): void {
        if (newAutosave === this.currentKanban.autosave) {
            return;
        }

        this.currentKanban.autosave = newAutosave;
        this.endChange(false);
    }

    public changeSaveToFile(newSaveToFile: boolean): void {
        if (newSaveToFile === this.currentKanban.saveToFile) {
            return;
        }

        this.currentKanban.saveToFile = newSaveToFile;
        this.endChange(false);
    }

    public changeBoardTitle(newTitle: string): void {
        if (!this.previousText.has('board')) {
            this.previousText.set('board', this.currentKanban.title);
        }

        const oldTitle = this.previousText.get('board')!;
        if (newTitle === oldTitle) {
            return;
        }

        this.boardTextUpdater.tryUpdate(() => {
            const copy = clone(this.currentKanban);
            copy.title = oldTitle;

            this.history.push({
                change: StateChanges.BOARD_TITLE,
                data: copy,
                details: `From "${oldTitle}" to "${newTitle}"`
            });

            this.previousText.delete('board');
        }, 'history-push');

        this.currentKanban.title = newTitle;
        this.endChange(true, this.boardTextUpdater);
    }

    public addColumn(): void {
        const columnName = `Column ${this.currentKanban.cols.length + 1}`;
        const column = createStrictColumnJson(columnName);

        this.currentKanban.cols.push(column);
        this.endChange(false);
    }

    public removeColumn(id: string): void {
        const columnIdx = this.getColumnIndex(id);
        if (columnIdx === -1) {
            return;
        }

        this.history.push({
            change: StateChanges.COLUMN_DELETED,
            data: clone(this.currentKanban),
            details: `Deleted "${this.currentKanban.cols[columnIdx].title}"`
        });

        this.currentKanban.cols.splice(columnIdx, 1);
        this.endChange(true);
    }

    public changeColumnTitle(id: string, newTitle: string) {
        const columnIdx = this.getColumnIndex(id);
        if (columnIdx === -1) {
            return;
        }

        const column = this.currentKanban.cols[columnIdx];

        if (!this.previousText.has(column.id)) {
            this.previousText.set(column.id, column.title);
        }
        const oldTitle = this.previousText.get(column.id)!;

        if (newTitle === oldTitle) {
            return;
        }

        this.columnTextUpdater.tryUpdate(() => {
            const copy = clone(this.currentKanban);
            copy.cols[columnIdx].title = oldTitle;

            this.history.push({
                change: StateChanges.COLUMN_TITLE,
                data: copy,
                details: `From "${oldTitle}" to "${newTitle}"`
            });

            this.previousText.delete(column.id);
        }, 'history-push');

        this.currentKanban.cols[columnIdx].title = newTitle;

        this.endChange(true, this.columnTextUpdater);
    }

    public changeColumnColor(id: string, newColor: string) {
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
            details: `"${column.title}" color changed`
        });

        this.currentKanban.cols[columnIdx].color = newColor;
        this.endChange(true);
    }

    public addTask(columnId: string): void {
        const columnIdx = this.getColumnIndex(columnId);
        if (columnIdx === -1) {
            return;
        }

        this.currentKanban.cols[columnIdx].tasks.splice(0, 0, createTaskJson());
        this.endChange(false);
    }

    public removeTask(columnId: string, taskId: string): void {
        const columnIdx = this.getColumnIndex(columnId);
        if (columnIdx === -1) {
            return;
        }
        const column = this.currentKanban.cols[columnIdx];

        const taskIdx = column.tasks.findIndex(t => t.id === taskId);
        if (taskIdx === -1) {
            return;
        }
        const task = column.tasks[taskIdx];
        const taskEmpty = (task.text === '');

        if (!taskEmpty) {
            this.history.push({
                change: StateChanges.TASK_DELETED,
                data: clone(this.currentKanban),
                details: `"${task.text}" removed from "${column.title}"`
            });
        }

        this.currentKanban.cols[columnIdx].tasks.splice(taskIdx, 1);
        this.endChange(!taskEmpty);
    }

    public moveTask(sourceCol: string, destCol: string, sourceIndex: number, destIndex: number): void {
        const sourceColIdx = this.getColumnIndex(sourceCol);
        const destColIdx = this.getColumnIndex(destCol);
        if (sourceColIdx === -1 || destColIdx === -1) {
            return;
        }

        const numSourceTasks = this.currentKanban.cols[sourceColIdx].tasks.length;
        const numDestTasks = this.currentKanban.cols[destColIdx].tasks.length;
        if (sourceIndex < 0 || sourceIndex >= numSourceTasks || destIndex < 0 || destIndex > numDestTasks) {
            //using > instead of >= for numDestTasks since task could be appended to end of array
            return;
        }

        const [task] = this.currentKanban.cols[sourceColIdx].tasks.splice(sourceIndex, 1);
        this.currentKanban.cols[destColIdx].tasks.splice(destIndex, 0, task);

        this.endChange(false);
    }

    public changeTaskText(columnId: string, taskId: string, newText: string) {
        const columnIdx = this.getColumnIndex(columnId);
        if (columnIdx === -1) {
            return;
        }

        const taskIdx = this.currentKanban.cols[columnIdx].tasks.findIndex(task => task.id === taskId);
        if (taskIdx === -1) {
            return;
        }

        if (!this.previousText.has(taskId)) {
            this.previousText.set(taskId, this.currentKanban.cols[columnIdx].tasks[taskIdx].text);
        }

        const oldText = this.previousText.get(taskId)!;

        if (newText === oldText) {
            return;
        }

        this.taskTextUpdater.tryUpdate(() => {
            const copy = clone(this.currentKanban);
            copy.cols[columnIdx].tasks[taskIdx].text = oldText;

            this.history.push({
                change: StateChanges.TASK_TEXT,
                data: copy,
                details: `"${oldText}" changed to "${newText}"`
            });

            this.previousText.delete(taskId);
        }, 'history-push');


        this.currentKanban.cols[columnIdx].tasks[taskIdx].text = newText;

        this.endChange(true, this.taskTextUpdater);
    }

    public reverseHistory(index: number) {
        if (index < 0 || index >= this.history.length) {
            return;
        }

        this.history.push({
            change: StateChanges.HISTORY_REVERSED,
            data: clone(this.currentKanban),
            details: `Changes reversed to item ${index + 1}`
        });

        const newKanban = clone(this.history[index].data);
        this.currentKanban = newKanban;

        this.endChange(true);
    }

    public save(kanban: StrictKanbanJSON | undefined = undefined) {
        if (kanban) {
            this.currentKanban = kanban;
            this.refresh();
        }

        this.vscodeHandler.save(this.currentKanban);
    }

    public getCurrentState() {
        return clone(this.currentKanban);
    }

    /*******************
     * Private Methods *
     *******************/

    private vscodeHandler;
    private currentKanban = createStrictKanbanJson();
    private kanbanChangeListeners: Array<(kanban: StrictKanbanJSON) => void> = [];
    private historyUpdateListeners: Array<(historyStep: HistoryObject) => void> = [];

    private history: HistoryObject[] = [];

    private loadFromVscode = (kanban: StrictKanbanJSON) => {
        this.currentKanban = kanban;
        this.refresh();
    };

    private getColumnIndex(columnId: string): number {
        return this.currentKanban.cols.findIndex(col => col.id === columnId);
    }

    private endChange(updateHistory: boolean, updater: DelayedUpdater | null = null) {
        if (this.currentKanban.autosave) {
            const save = () => this.vscodeHandler.save(this.currentKanban);

            if (updater) {
                updater.tryUpdate(save, 'save');
            } else {
                save();
            }
        }

        const doUpdateHistory = updateHistory
            ? () => this.historyUpdateListeners.forEach(listener => listener(this.history[this.history.length - 1]))
            : () => undefined;

        if (updater) {
            updater.tryUpdate(doUpdateHistory, 'history');
        } else {
            doUpdateHistory();
        }

        this.refresh();
    }

    private taskTextUpdater = new DelayedUpdater(1000);
    private boardTextUpdater = new DelayedUpdater(1000);
    private columnTextUpdater = new DelayedUpdater(1000);

    private previousText: Map<string, string> = new Map();
}

export default new BoardState();