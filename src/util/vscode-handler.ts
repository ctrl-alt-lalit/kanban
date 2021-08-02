declare var acquireVsCodeApi: () => VsCodeApi;
interface VsCodeApi {
    getState: () => any;
    setState: (newState: any) => any;
    postMessage: (message: any) => void;
}



class VscodeHandler {
    send(command: string, data: any) {
        VscodeHandler.vscode.postMessage({
            command: command,
            data: data
        });
    }

    addLoadListener(callback: (data: StrictKanbanJSON) => void) {
        this.loadCallbacks.push(callback);
    }

    removeLoadListener(callback: (data: StrictKanbanJSON) => void) {
        this.loadCallbacks = this.loadCallbacks.filter(cb => cb !== callback);
    }

    constructor() {
        window.addEventListener('message', event => {
            const {command, data} = event.data as {command: string, data: any};
            
            if (command === 'load') {
                const sanitized = this.sanitizeKanbanJson(data as KanbanJSON);
                this.loadCallbacks.forEach(cb => cb(sanitized));
            }
        });
    }

    private sanitizeKanbanJson(data: KanbanJSON): StrictKanbanJSON {
        function makeRandomArray(size: number): string[] {
            let arr = new Array(size).fill('0');
            for (let i = 0; i < size; ++i) {
                arr[i] = Math.random().toString(36);
            }
            return arr;
        }

        function sanitizeColumnJson(col: ColumnJSON): StrictColumnJSON {
            return {
                title: col.title,
                tasks: col.tasks,
                taskIds: col.taskIds ?? makeRandomArray(col.tasks.length)
            };
        }

        return {
            cols: data.cols.map(col => sanitizeColumnJson(col)),
            columnIds: data.columnIds ?? makeRandomArray(data.cols.length),
            settings: data.settings ?? {autosave: false}
        };
    }


    private static vscode =  acquireVsCodeApi();
    
    private loadCallbacks: ((data: StrictKanbanJSON) => void)[] = [];
}

export default new VscodeHandler();