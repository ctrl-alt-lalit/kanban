type ColumnJSON = {
    title: string,
    ntasks?: number,
    id?: string, tasks: string[] | TaskJSON[],
    color?: string,
};

type StrictColumnJSON = {
    title: string,
    id: string,
    tasks: TaskJSON[],
    color: string
};

type KanbanJSON = {
    title?: string,
    ncols?: number, cols: ColumnJSON[],
    settings?: { autosave: boolean },
    autosave?: boolean,
    saveToFile?: boolean,
    timestamp?: number
};

type StrictKanbanJSON = {
    title: string,
    cols: StrictColumnJSON[],
    autosave: boolean,
    saveToFile: boolean,
    timestamp: number
};

type TaskJSON = {
    text: string,
    id: string
};

interface VsCodeApi {
    getState: () => any;
    setState: (newState: any) => any;
    postMessage: (message: any) => void;
}