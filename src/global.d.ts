type ColumnJSON = {
    title: string,
    ntasks?: number,
    id?: string,
    tasks: string[] | TaskJSON[],
};

type StrictColumnJSON = {
    title: string,
    id: string,
    tasks: TaskJSON[],
};

type KanbanJSON = {
    title?: string,
    ncols?: number,
    cols: ColumnJSON[],
    settings?: {autosave: boolean},
    autosave?: boolean
};

type StrictKanbanJSON = {
    title: string,
    cols: StrictColumnJSON[],
    autosave: boolean
};

type TaskJSON = {
    text: string,
    id: string
};
