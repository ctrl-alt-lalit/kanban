import { createKanbanJson, WeakKanbanJson, KanbanJson, toKanbanJson } from './kanban-types';
declare var acquireVsCodeApi: () => VsCodeApi;

type SaveMessage = {
    command: 'save' | 'load';
    data: KanbanJson;
};

type SettingsMessage = {
    command: 'open-settings' | 'load';
    data: null;
};

export enum ColorTheme {
    THEME_LIGHT = 1,
    THEME_DARK = 2,
    THEME_LIGHT_HIGHCONTRAST = 4,
    THEME_DARK_HIGHCONTRAST = 3,
}

type ThemeMessage = {
    command: 'theme-changed';
    data: ColorTheme;
};

export type ApiMessage = SaveMessage | SettingsMessage | ThemeMessage;

interface VsCodeApi {
    postMessage: (message: ApiMessage) => void;
}

let dummyVscode: VsCodeApi = {
    postMessage: () => null,
};
const vscode = typeof acquireVsCodeApi === 'undefined' ? dummyVscode : acquireVsCodeApi();

/**
 * Simpler interface for interacting the VSCode's Extension Host.
 */
class VsCodeHandler {
    /**
     * Tells the Extension Host to send previously saved data.
     */
    load() {
        vscode.postMessage({ command: 'load', data: null });
    }

    /**
     * Tells the Extension Host to save `data`.
     * @param {KanbanJson} kanban Kanban Board state to be saved
     */
    save(kanban: KanbanJson) {
        kanban.timestamp = Date.now();
        vscode.postMessage({ command: 'save', data: kanban });
    }

    /**
     * Tells VsCode to open settings for this extension.
     */
    openExtensionSettings() {
        vscode.postMessage({ command: 'open-settings', data: null });
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

    addThemeChangeListener(callback: (theme: ColorTheme) => void) {
        this.themeCallbacks.push(callback);
    }

    removeThemeChangeListener(callback: (theme: ColorTheme) => void) {
        this.themeCallbacks = this.themeCallbacks.filter((cb) => cb !== callback);
    }

    /**
     * Only call the constructor once in the lifetime of the extension.
     * Using multiple VscodeHandlers has not been tested and is unsupported.
     */
    constructor() {
        // VSCode's postMessage API has no way to set target window identity, so no way to verify
        window.addEventListener('message', (event) => {
            let { command, data } = event.data as ApiMessage;

            if (command === 'load') {
                data ??= createKanbanJson();
                const kanban = toKanbanJson(data as WeakKanbanJson);
                this.loadCallbacks.forEach((cb) => cb(kanban));
            } else if (command === 'theme-changed') {
                this.themeCallbacks.forEach((cb) => cb(data as ColorTheme));
            }
        });
    }

    /**
     * List of callbacks to run after receiving
     * the 'load' message from the Extension Host.
     */
    private loadCallbacks: Array<(kanban: KanbanJson) => void> = [];
    private themeCallbacks: Array<(theme: ColorTheme) => void> = [];
}

export default new VsCodeHandler();
