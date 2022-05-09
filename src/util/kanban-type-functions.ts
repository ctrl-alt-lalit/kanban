/**
 * @file Provides functions to convert from (Task | Column | Kanban)JSONs to their stricter variants.
 * Also gives factory methods for each of the strict JSONs.
 *
 * Less strict exist for backwards-compatibility. While the strict types are what the current version
 * of this extension should use anyway. Converting all the less strict types at the beginning lets
 * the rest of the extension assume that strict, up-to-date types are always in use.
 */

import cuid from 'cuid';

export type ColumnJSON = {
    title: string;
    ntasks?: number;
    id?: string;
    tasks: string[] | TaskJSON[];
    color?: string;
};

export type StrictColumnJSON = {
    title: string;
    id: string;
    tasks: TaskJSON[];
    color: string;
};

export type KanbanJSON = {
    title?: string;
    ncols?: number;
    cols: ColumnJSON[];
    settings?: { autosave: boolean };
    autosave?: boolean;
    saveToFile?: boolean;
    timestamp?: number;
};

export type StrictKanbanJSON = {
    title: string;
    cols: StrictColumnJSON[];
    autosave: boolean;
    saveToFile: boolean;
    timestamp: number;
};

export type TaskJSON = {
    text: string;
    id: string;
};

/**
 * If `task` is a string, converts it to a TaskJSON
 *
 * @param {TaskJSON | string} task TaskJSON or string being converted
 * @returns {TaskJSON} `task` or a TaskJSON with its text field equal to `task`
 */
export function toTaskJson(task: TaskJSON | string): TaskJSON {
    if (typeof task === 'string') {
        return { text: task, id: cuid() };
    } else {
        return task;
    }
}

/**
 * Converts a ColumnJSON to a StrictColumnJSON
 *
 * @param {ColumnJSON} column ColumnJSON being converted
 * @returns {StrictColumnJSON} StrictColumnJSON with `column`'s fields (when possible) or default values
 */
export function toStrictColumnJson(column: ColumnJSON): StrictColumnJSON {
    return {
        title: column.title,
        tasks: column.tasks.map((task) => toTaskJson(task)),
        id: column.id ?? cuid(),
        color: column.color ?? 'var(--vscode-editor-foreground)',
    };
}

/**
 * Converts a KanbanJSON to StrictKanbanJSON
 *
 * @param {KanbanJSON} kanban  KanbanJSON being converted
 * @returns {StrictKanbanJSON} StrictKanbanJSON with `kanban`'s fields (when possible) or default values
 */
export function toStrictKanbanJson(kanban: KanbanJSON): StrictKanbanJSON {
    let autosave = false;
    if (kanban.autosave !== undefined) {
        autosave = kanban.autosave;
    } else if (kanban.settings?.autosave !== undefined) {
        autosave = kanban.settings.autosave;
    }

    return {
        title: kanban.title ?? 'Kanban',
        cols: kanban.cols.map((col) => toStrictColumnJson(col)),
        autosave: autosave,
        saveToFile: kanban.saveToFile ?? false,
        timestamp: kanban.timestamp ?? Date.now(),
    };
}

/**
 * @param {string} text markdown text the task will display
 * @returns {TaskJSON} TaskJSON with the given text or an empty string
 */
export function createTaskJson(text?: string): TaskJSON {
    return {
        text: text ?? '',
        id: cuid(),
    };
}

/**
 * @param {string} title title of the column
 * @param {TaskJSON[]} tasks Array of TaskJSON's to display in the column
 * @param {string} color hex string for the column's color
 * @returns {StrictColumnJSON} StrictColumnJSON with the given or default parameters
 */
export function createStrictColumnJson(
    title?: string,
    tasks?: TaskJSON[],
    color?: string
): StrictColumnJSON {
    return {
        title: title ?? 'New Column',
        tasks: tasks ?? [],
        id: cuid(),
        color: color ?? 'var(--vscode-editor-foreground)',
    };
}

/**
 * @param {string} [title='Kanban'] title of the kanban board
 * @param {StrictColumnJSON[]} [columns] columns in the board
 * @param {boolean} [autosave=false] whether to save on every change
 * @returns {StrictKanbanJSON} StrictKanbanJSON with the given or default paremeters.
 */
export function createStrictKanbanJson(
    title?: string,
    columns?: StrictColumnJSON[],
    autosave?: boolean,
    saveToFile?: boolean
): StrictKanbanJSON {
    if (!columns) {
        columns = [
            createStrictColumnJson('Bugs', [], '#eb144c'),
            createStrictColumnJson('To-Do', [createTaskJson()], '#fcb900'),
            createStrictColumnJson('Doing', [], '#0693e3'),
            createStrictColumnJson('Done', [], '#00d084'),
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
