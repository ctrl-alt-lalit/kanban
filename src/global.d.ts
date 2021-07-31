type ColumnJSON = {
    title: string,
    ntasks: number,
    tasks: string[]
};

type KanbanJSON = {
    ncols: number,
    cols: ColumnJSON[],
    settings?: any
};