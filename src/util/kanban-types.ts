/**
 * @file Provides functions to convert from Weak(Task | Column | Kanban)JSONs to their stricter variants.
 * Also gives factory methods for each of the strict JSONs.
 *
 * Weak types exist for backwards-compatibility. While the normal types are what the current version
 * of this extension uses. Converting all the weak types at the beginning lets
 * the rest of the extension assume that strict, up-to-date types are always in use.
 */

import { createId } from '@paralleldrive/cuid2';

export type WeakColumnJson = {
    title: string;
    ntasks?: number;
    id?: string;
    tasks: string[] | TaskJson[];
    color?: string;
};

export type ColumnJson = {
    title: string;
    id: string;
    tasks: TaskJson[];
    color: string;
};

export type WeakKanbanJson = {
    title?: string;
    ncols?: number;
    cols: WeakColumnJson[];
    settings?: { autosave: boolean };
    autosave?: boolean;
    saveToFile?: boolean;
    timestamp?: number;
};

export type KanbanJson = {
    title: string;
    cols: ColumnJson[];
    autosave: boolean;
    saveToFile: boolean;
    timestamp: number;
};

export type TaskJson = {
    text: string;
    id: string;
};

/**
 * If `task` is a string, creates a TaskJSON containing that string.
 *
 * @param {TaskJson | string} task TaskJSON or string being converted
 * @returns {TaskJson} `task` or a TaskJSON with its text field equal to `task`
 */
export function toTaskJson(task: TaskJson | string): TaskJson {
    if (typeof task === 'string') {
        return { text: task, id: createId() };
    } else {
        return task;
    }
}

/**
 * Converts a WeakColumnJSON to a ColumnJSON. Conversion does NOT happen in-place.
 *
 * @param {WeakColumnJson} column WeakColumnJSON being converted
 * @returns {ColumnJson} ColumnJSON with `column`'s fields (when possible) or default values
 */
export function toColumnJson(column: WeakColumnJson): ColumnJson {
    return {
        title: column.title,
        tasks: column.tasks.map((task) => toTaskJson(task)),
        id: column.id ?? createId(),
        color: column.color ?? 'var(--vscode-editor-foreground)',
    };
}

/**
 * Converts a WeakKanbanJSON to a KanbanJSON. Conversion does NOT happen in-place.
 *
 * @param {WeakKanbanJson} kanban  WeakKanbanJSON being converted
 * @returns {KanbanJson} KanbanJSON with `kanban`'s fields (when possible) or default values
 */
export function toKanbanJson(kanban: WeakKanbanJson): KanbanJson {
    let autosave = false;
    if (kanban.autosave !== undefined) {
        autosave = kanban.autosave;
    } else if (kanban.settings?.autosave !== undefined) {
        autosave = kanban.settings.autosave;
    }

    return {
        title: kanban.title ?? 'Kanban',
        cols: kanban.cols.map((col) => toColumnJson(col)),
        autosave: autosave,
        saveToFile: kanban.saveToFile ?? false,
        timestamp: kanban.timestamp ?? Date.now(),
    };
}

/**
 * @param {string} text markdown text the task will display
 * @returns {TaskJson} TaskJSON with the given text or an empty string
 */
export function createTaskJson(text?: string): TaskJson {
    return {
        text: text ?? '',
        id: createId(),
    };
}

/**
 * @param {string} title title of the column
 * @param {TaskJson[]} tasks Array of TaskJSON's to display in the column
 * @param {string} color hex string for the column's color
 * @returns {ColumnJson} StrictColumnJSON with the given or default parameters
 */
export function createColumnJson(title?: string, tasks?: TaskJson[], color?: string): ColumnJson {
    return {
        title: title ?? 'New Column',
        tasks: tasks ?? [],
        id: createId(),
        color: color ?? 'var(--vscode-editor-foreground)',
    };
}

/**
 * @param {string} [title='Kanban'] title of the kanban board
 * @param {ColumnJson[]} [columns] columns in the board
 * @param {boolean} [autosave=false] whether to save on every change
 * @returns {KanbanJson} StrictKanbanJSON with the given or default paremeters.
 */
export function createKanbanJson(
    title?: string,
    columns?: ColumnJson[],
    autosave?: boolean,
    saveToFile?: boolean
): KanbanJson {
    if (!columns) {
        columns = [
            createColumnJson('Bugs', [], '#eb144c'),
            createColumnJson('To-Do', [createTaskJson()], '#fcb900'),
            createColumnJson('Doing', [], '#0693e3'),
            createColumnJson('Done', [], '#00d084'),
        ];
    }

    return {
        title: title ?? 'Kanban',
        cols: columns,
        autosave: autosave ?? false,
        saveToFile: saveToFile ?? false,
        timestamp: Date.now(),
    };
}
