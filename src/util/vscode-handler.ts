/**
 * @file Provides a "meta-API" for the VsCode Api. Only exposing functionality that is relevant to the extension.
 *
 * This also makes testing easier, since the VsCode API only has to be emulated in one place rather than throughout the project.
 */

import { createKanbanJson, WeakKanbanJson, KanbanJson, toKanbanJson } from './kanban-types';
declare const acquireVsCodeApi: () => VsCodeApi;

type SaveMessage = {
    command: 'save' | 'load';
    data: KanbanJson;
};

type SettingsMessage = {
    command: 'open-settings' | 'load';
    data: null;
};

type ExtensionSettingsMessage = {
    command: 'extension-settings-changed';
    data: ExtensionSettingsMessageData;
};

export type ExtensionSettingsMessageData = {
    showScanlines: boolean;
    colorTheme: ColorTheme;
};

/**
 * The types of color themes VSCode supports.
 * This must be analagous to vscode.ColorThemeKind
 */
export enum ColorTheme {
    THEME_LIGHT = 1,
    THEME_DARK = 2,
    THEME_LIGHT_HIGHCONTRAST = 4,
    THEME_DARK_HIGHCONTRAST = 3,
}

/**
 * The types of messages this extension can receive from the Extension Host.
 */
export type ApiMessage = SaveMessage | SettingsMessage | ExtensionSettingsMessage;

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
     */
    addLoadListener(callback: (kanban: KanbanJson) => void) {
        this.loadCallbacks.push(callback);
    }

    /**
     * If 'addLoadListener(`callback`)' was called,
     * removes `callback` from the list of load callbacks.
     */
    removeLoadListener(callback: (kanban: KanbanJson) => void) {
        this.loadCallbacks = this.loadCallbacks.filter((cb) => cb !== callback);
    }

    addExtensionSettingsChangeListener(
        callback: (showScanlines: ExtensionSettingsMessageData) => void
    ) {
        this.extensionSettingCallbacks.push(callback);
    }

    removeExtensionSettingsChangedListener(callback: (data: ExtensionSettingsMessageData) => void) {
        this.extensionSettingCallbacks = this.extensionSettingCallbacks.filter(
            (cb) => cb !== callback
        );
    }

    /**
     * Only call the constructor once in the lifetime of the extension.
     */
    constructor() {
        // VSCode's postMessage API has no way to set target window identity, so no way to verify
        window.addEventListener('message', (event) => {
            let { command, data } = event.data as ApiMessage;

            if (command === 'load') {
                data ??= createKanbanJson();
                const kanban = toKanbanJson(data as WeakKanbanJson);
                this.loadCallbacks.forEach((cb) => cb(kanban));
            } else if (command === 'extension-settings-changed') {
                this.extensionSettingCallbacks.forEach((cb) =>
                    cb(data as ExtensionSettingsMessageData)
                );
            }
        });
    }

    private loadCallbacks: Array<(kanban: KanbanJson) => void> = [];
    private extensionSettingCallbacks: Array<(data: ExtensionSettingsMessageData) => void> = [];
}

export default new VsCodeHandler();
