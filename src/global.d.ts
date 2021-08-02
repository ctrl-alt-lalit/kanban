type ColumnJSON = {
    title: string,
    ntasks?: number,
    tasks: string[],
    taskIds?: string[],
};

type StrictColumnJSON = {
    title: string,
    tasks: string[],
    taskIds: string[],
};

type KanbanJSON = {
    ncols?: number,
    cols: ColumnJSON[],
    columnIds?: string[],
    settings?: {autosave: boolean}
};

type StrictKanbanJSON = {
    cols: StrictColumnJSON[],
    columnIds: string[],
    settings: {autosave: boolean}
};
