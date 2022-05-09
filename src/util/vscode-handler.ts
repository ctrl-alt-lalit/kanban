import { createKanbanJson, WeakKanbanJson, KanbanJson, toKanbanJson } from './kanban-types';

export interface VsCodeApi {
    postMessage: (message: any) => void;
}

/**
 * Simpler interface for interacting the VSCode's Extension Host.
 */
class VsCodeHandler {
    /**
     * Tells the Extension Host to send previously saved data.
     */
    load() {
        this.vscode.postMessage({ command: 'load', data: null });
    }

    /**
     * Tells the Extension Host to save `data`.
     * @param {KanbanJson} kanban Kanban Board state to be saved
     */
    save(kanban: KanbanJson) {
        kanban.timestamp = Date.now();
        this.vscode.postMessage({ command: 'save', data: kanban });
    }

    /**
     * Makes it so `callback` will be run immediately after
     * receiving a 'load' command from the Extension Host.
     *
     * @param {(data: KanbanJson) => void} callback function to run after loading data
     */
    addLoadListener(callback: (kanban: KanbanJson) => void) {
        this.loadCallbacks.push(callback);
    }

    /**
     * If 'addLoadListener(`callback`)' was called,
     * removes `callback` from the list of load callbacks.
     *
     * @param {(data: KanbanJson) => void} callback function to remove
     */
    removeLoadListener(callback: (kanban: KanbanJson) => void) {
        this.loadCallbacks = this.loadCallbacks.filter((cb) => cb !== callback);
    }

    /**
     * Only call the constructor once in the lifetime of the extension.
     * Using multiple VscodeHandlers has not been tested and is unsupported.
     */
    constructor(vscode: VsCodeApi) {
        this.vscode = vscode;

        // VSCode's postMessage API has no way to set target window identity, so no way to verify
        window.addEventListener('message', (event) => {
            let { command, data } = event.data as { command: string; data: any };

            if (command === 'load') {
                data ??= createKanbanJson();
                const kanban = toKanbanJson(data as WeakKanbanJson);
                this.loadCallbacks.forEach((cb) => cb(kanban));
            }
        });
    }

    /**
     * Connects the webview to the Extension Host.
     */
    private vscode: VsCodeApi;

    /**
     * List of callbacks to run after receiving
     * the 'load' message from the Extension Host.
     */
    private loadCallbacks: Array<(kanban: KanbanJson) => void> = [];
}

export default VsCodeHandler;
