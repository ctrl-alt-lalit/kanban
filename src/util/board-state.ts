import { createStrictColumnJson, createStrictKanbanJson, createTaskJson } from "./kanban-type-functions";
import VsCodeHandler from "./vscode-handler";

enum StateChanges {
    AUTOSAVE,
    SAVE_TO_FILE,
    TITLE,

    COLUMN_ADDED,
    COLUMN_DELETED,
    COLUMN_TITLE,
    COLUMN_COLOR,

    TASK_ADDED,
    TASK_DELETED,
    TASK_MOVED,
    TASK_TEXT
}

class BoardState {
    constructor(vscodeHandler: VsCodeHandler) {
        this.vscodeHandler = vscodeHandler;
        this.vscodeHandler.addLoadListener(this.loadFromVscode);
        this.vscodeHandler.load();
    }

    public addChangeListener(listener: (kanban: StrictKanbanJSON) => void) {
        this.changeListeners.push(listener);
    }

    public removeChangeListenr(listener: (kanban: StrictKanbanJSON) => void) {
        this.changeListeners = this.changeListeners.filter(l => l !== listener);
    }

    public refresh() {
        this.changeListeners.forEach(listener => listener(this.currentKanban));
    }

    public changeAutosave(newAutosave: boolean): void {
        if (newAutosave === this.currentKanban.autosave) {
            return;
        }

        const change = {
            type: StateChanges.AUTOSAVE,
            from: this.currentKanban.autosave,
            to: newAutosave
        };

        this.history.push(change);

        this.currentKanban.autosave = newAutosave;
        this.endChange();
    }

    public changeSaveToFile(newSaveToFile: boolean): void {
        if (newSaveToFile === this.currentKanban.saveToFile) {
            return;
        }

        const change = {
            type: StateChanges.SAVE_TO_FILE,
            from: this.currentKanban.saveToFile,
            to: newSaveToFile
        };
        this.history.push(change);

        this.currentKanban.saveToFile = newSaveToFile;
        this.endChange();
    }

    public changeBoardTitle(newTitle: string): void {
        if (newTitle === this.currentKanban.title) {
            return;
        }

        const change = {
            type: StateChanges.TITLE,
            from: this.currentKanban.title,
            to: newTitle
        };
        this.history.push(change);

        this.currentKanban.title = newTitle;
        this.endChange();
    }

    public addColumn(): void {
        const column = createStrictColumnJson();

        const change = {
            type: StateChanges.COLUMN_ADDED,
            from: null,
            to: column
        };
        this.history.push(change);

        this.currentKanban.cols.push(column);
        this.endChange();
    }

    public removeColumn(id: string): void {
        const columnIdx = this.getColumnIndex(id);
        if (columnIdx === -1) {
            return;
        }

        const change = {
            type: StateChanges.COLUMN_DELETED,
            from: {
                column: this.currentKanban.cols[columnIdx],
                index: columnIdx
            },
            to: null
        };
        this.history.push(change);

        this.currentKanban.cols.splice(columnIdx, 1);
        this.endChange();
    }

    public changeColumnTitle(id: string, newTitle: string) {
        const columnIdx = this.getColumnIndex(id);
        if (columnIdx === -1) {
            return;
        }

        const column = this.currentKanban.cols[columnIdx];
        if (column.title === newTitle) {
            return;
        }

        const change = {
            type: StateChanges.COLUMN_TITLE,
            from: {
                id: column.id,
                title: column.title
            },
            to: {
                id: column.id,
                title: newTitle
            }
        };
        this.history.push(change);

        this.currentKanban.cols[columnIdx].title = newTitle;
        this.endChange();
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

        const change = {
            type: StateChanges.COLUMN_COLOR,
            from: {
                id: column.id,
                color: column.color
            },
            to: {
                id: column.id,
                color: newColor
            }
        };
        this.history.push(change);

        this.currentKanban.cols[columnIdx].color = newColor;
        this.endChange();
    }

    public addTask(columnId: string): void {
        const columnIdx = this.getColumnIndex(columnId);
        if (columnIdx === -1) {
            return;
        }

        const task = createTaskJson();

        const change = {
            type: StateChanges.TASK_ADDED,
            from: null,
            to: {
                columnId: columnId,
                task: task
            }
        };
        this.history.push(change);

        this.currentKanban.cols[columnIdx].tasks.push(task);
        this.endChange();
    }

    public removeTask(columnId: string, taskId: string): void {
        const columnIdx = this.getColumnIndex(columnId);
        if (columnIdx === -1) {
            return;
        }

        const taskIdx = this.currentKanban.cols[columnIdx].tasks.findIndex(task => task.id === taskId);
        if (taskIdx === -1) {
            return;
        }

        const change = {
            type: StateChanges.TASK_DELETED,
            from: {
                columnId: columnId,
                task: this.currentKanban.cols[columnIdx].tasks[taskIdx],
                taskIdx: taskIdx
            },
            to: null
        };
        this.history.push(change);

        this.currentKanban.cols[columnIdx].tasks.splice(taskIdx, 1);
        this.endChange();
    }

    public moveTask(sourceCol: string, destCol: string, sourceIndex: number, destIndex: number): void {
        const sourceColIdx = this.getColumnIndex(sourceCol);
        const destColIdx = this.getColumnIndex(destCol);
        if (sourceColIdx === -1 || destColIdx === -1) {
            return;
        }

        const numSourceTasks = this.currentKanban.cols[sourceColIdx].tasks.length;
        const numDestTasks = this.currentKanban.cols[destColIdx].tasks.length;
        if (sourceIndex < 0 || sourceIndex >= numSourceTasks || destIndex < 0 || destIndex >= numDestTasks) {
            return;
        }

        const change = {
            type: StateChanges.TASK_MOVED,
            from: {
                columnId: sourceCol,
                task: this.currentKanban.cols[sourceColIdx].tasks[sourceIndex],
                taskIdx: sourceIndex
            },
            to: {
                columnId: destCol,
                task: this.currentKanban.cols[sourceColIdx].tasks[sourceIndex],
                taskIdx: destIndex
            }
        };
        this.history.push(change);

        const [task] = this.currentKanban.cols[sourceColIdx].tasks.splice(sourceIndex, 1);
        this.currentKanban.cols[destColIdx].tasks.splice(destIndex, 0, task);
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

        const change = {
            type: StateChanges.TASK_TEXT,
            from: {
                columnId: columnId,
                taskId: taskId,
                text: this.currentKanban.cols[columnIdx].tasks[taskIdx].text
            },
            to: {
                columnId: columnId,
                taskId: taskId,
                text: newText
            }
        };
        this.history.push(change);

        this.currentKanban.cols[columnIdx].tasks[taskIdx].text = newText;
        this.endChange();
    }

    private vscodeHandler;
    private currentKanban = createStrictKanbanJson();
    private changeListeners: Array<(kanban: StrictKanbanJSON) => void> = [];

    private history: Array<{ type: StateChanges, from: any, to: any }> = [];

    private loadFromVscode = (kanban: StrictKanbanJSON) => {
        this.currentKanban = kanban;
    };

    private getColumnIndex(columnId: string): number {
        return this.currentKanban.cols.findIndex(col => col.id === columnId);
    }

    private endChange() {
        if (this.currentKanban.autosave) {
            this.vscodeHandler.save(this.currentKanban);
        }

        this.refresh();
    }
}

export default BoardState;