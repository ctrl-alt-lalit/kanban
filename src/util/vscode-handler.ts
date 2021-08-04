declare var acquireVsCodeApi: () => VsCodeApi;
interface VsCodeApi {
    getState: () => any;
    setState: (newState: any) => any;
    postMessage: (message: any) => void;
}



class VscodeHandler {
    load() {
        this.send('load', null);
    }

    save(data: StrictKanbanJSON) {
        this.send('save', data);
    }

    addLoadListener(callback: (data: StrictKanbanJSON) => void) {
        this.loadCallbacks.push(callback);
    }

    removeLoadListener(callback: (data: StrictKanbanJSON) => void) {
        this.loadCallbacks = this.loadCallbacks.filter(cb => cb !== callback);
    }

    constructor() {
        window.addEventListener('message', event => {
            let {command, data} = event.data as {command: string, data: any};
            
            if (command === 'load') {
                const defaultData = {
                    cols: [
                        {title: 'Bugs', tasks: []},
                        {title: 'To-Do', tasks: ['']},
                        {title: 'Doing', tasks: []},
                        {title: 'Done', tasks: []}
                    ]
                };
                data ??= defaultData;
                const sanitized = this.sanitizeKanbanJson(data as KanbanJSON);
                this.loadCallbacks.forEach(cb => cb(sanitized));
            }
        });
    }

    private sanitizeKanbanJson(data: KanbanJSON): StrictKanbanJSON {

        function sanitizeColumnJson(col: ColumnJSON): StrictColumnJSON {
            function sanitizeTaskJson(task: string | TaskJSON) {
                if (typeof task === 'string') {
                    return {text: task, id: Math.random().toString(36)};
                } else {
                    return task;
                }
            }

            return {
                title: col.title,
                tasks: col.tasks.map(task => sanitizeTaskJson(task)),
                id: Math.random().toString(36)
            };
        }

        let autosave = false;
        if (data.autosave !== undefined) {
            autosave = data.autosave;
        } else if (data.settings?.autosave !== undefined) {
            autosave = data.settings.autosave;
        }

        return {
            title: data.title ?? 'Kanban',
            cols: data.cols.map(col => sanitizeColumnJson(col)),
            autosave: autosave
        };
    }


    private static vscode =  acquireVsCodeApi();
    
    private loadCallbacks: ((data: StrictKanbanJSON) => void)[] = [];

    private send(command: string, data: any) {
        VscodeHandler.vscode.postMessage({
            command: command,
            data: data
        });
    }
}

export default new VscodeHandler();