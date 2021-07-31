declare var acquireVsCodeApi: () => VsCodeApi;
interface VsCodeApi {
    getState: () => any;
    setState: (newState: any) => any;
    postMessage: (message: any) => void;
};



class MessageHandler {
    send(command: string, data: any) {
        MessageHandler.vscode.postMessage({
            command: command,
            data: data
        });
    }

    addListener(callback: (command: string, data: any) => void) {
        this.callbacks.push(callback);
    }

    removeListener(callback: (command: string, data: any) => void) {
        this.callbacks = this.callbacks.filter(cb => cb !== callback);
    }

    constructor() {
        window.addEventListener('message', event => {
            const {command, data} = event.data as {command: string, data: any};
            this.callbacks.forEach(cb => cb(command, data));
        });
    }

    get previouslySavedData(): KanbanJSON | undefined {
        return MessageHandler.previousData;
    }


    private static vscode =  acquireVsCodeApi();
    private static loadDataCallback = (command: string, data: any) => {
        if (command === 'load') {
            const defaultData = {
                ncols: 4,
                cols: [
                    {title: 'Bugs', ntasks: 0, tasks: []},
                    {title: 'To-Do', ntasks: 1, tasks: ['']},
                    {title: 'Doing', ntasks: 0, tasks: []},
                    {title: 'Done', ntasks: 0, tasks: []}
                ],
                settings: {autosave: false}
            };

            MessageHandler.previousData = data ?? defaultData;
        }
    };
    private callbacks: ((command: string, data: any) => void)[] = [MessageHandler.loadDataCallback];
    private static previousData: KanbanJSON | undefined = undefined;
}

export default new MessageHandler();