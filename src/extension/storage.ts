/**
 * @file Manages saving and loading the Kanban board.
 */

import * as vscode from 'vscode';
import * as path from 'path';

/**
 * Wrapper for VSCode Mementos and/or the filesystem -- depending on what the user saved their board to.
 */
export default class Storage {
    /**
     *
     * @param {vscode.Memento} memento Memento to save/load board to/from
     * @param {string | undefined} workspacePath Absolute path of current workspace (if applicable)
     * @param {string[]} saveFilePaths List of file paths to save/load board to/from
     */
    constructor(
        memento: vscode.Memento,
        workspacePath: string | undefined,
        saveFilePaths: string[]
    ) {
        this.memento = memento;

        for (const savePath of saveFilePaths) {
            if (savePath.length === 0) {
                continue;
            }

            if (path.isAbsolute(savePath)) {
                this.saveUris.push(vscode.Uri.file(savePath));
            }

            if (!workspacePath) {
                continue;
            }

            this.saveUris.push(vscode.Uri.file(path.join(workspacePath, savePath)));
        }
    }

    /**
     * Checks the VSCode Memento and a list of files (determined by extension settings) for Kanban boards.
     * @returns The most recently saved Kanban board
     */
    public async loadKanban<T>(): Promise<T> {
        //TODO: put default kanban initialization here
        const mementoData = this.memento.get<T>(Storage.kanbanKey, null as any) as any;
        if (this.saveUris.length === 0) {
            return mementoData;
        }

        let fileKanban: any = null;
        for (const saveUri of this.saveUris) {
            try {
                const buffer = await vscode.workspace.fs.readFile(saveUri);
                const fileData = JSON.parse(buffer.toString());
                if (isWeakKanbanJson(fileData)) {
                    fileKanban = fileData;
                    this.preferredUri = saveUri;
                    break;
                }
            } catch {
                /*
                 * File not found.
                 *
                 * This is not actually ~exceptional~ ; however, vscode's
                 * filesystem api doesn't have a "check if the file exists" function.
                 */
            }
        }

        // If we have only one, pick the one we have
        if (!mementoData) {
            return fileKanban;
        } else if (!fileKanban) {
            return mementoData;
        }

        // We have both; pick the more recent one
        const mementoTime = mementoData?.timestamp ?? -1;
        const fileTime = fileKanban.timestamp ?? -1;
        return fileTime >= mementoTime ? fileKanban : mementoData;
    }

    /**
     * Saves `data` to a memento or a file -- depending on the value of `data.saveToFile`.
     * @param {KanbanJson} data The board to save
     */
    public saveKanban<T>(data: T) {
        const kanban = data as any;
        if (!kanban?.saveToFile || this.saveUris.length === 0) {
            this.memento.update(Storage.kanbanKey, kanban);
            return;
        }

        this.preferredUri ??= this.saveUris[0];
        try {
            const buffer: Uint8Array = Buffer.from(JSON.stringify(kanban, null, 4));
            vscode.workspace.fs.writeFile(this.preferredUri, buffer);
        } catch {
            console.error('Could not save to file. Writing to workspace instead.');
            this.memento.update(Storage.kanbanKey, kanban);
        }
    }

    private memento: vscode.Memento;
    private static kanbanKey = 'columns';
    private saveUris: vscode.Uri[] = [];
    private preferredUri: vscode.Uri | undefined = undefined;
}

/**
 * Checks if `obj` is a WeakKanbanJson (or KanbanJson)
 * @param {any} obj Object to be verified
 */
export function isWeakKanbanJson(obj: any): boolean {
    const mandatoryKanbanKeys = ['cols'] as const;
    const optionalKanbanKeys = [
        'title',
        'ncols',
        'settings',
        'autosave',
        'saveToFile',
        'timestamp',
    ] as const;
    if (!matchingKeys(obj, mandatoryKanbanKeys, optionalKanbanKeys)) {
        return false;
    }

    if (!Array.isArray(obj.cols)) {
        return false;
    }

    for (const col of obj.cols) {
        if (!isWeakColumnJson(col)) {
            return false;
        }
    }

    return true;

    function matchingKeys(
        obj: any,
        requiredKeys: Readonly<string[]>,
        optionalKeys: Readonly<string[]>
    ): boolean {
        if (typeof obj !== 'object') {
            return false;
        }

        let keys = Object.keys(obj).filter((key) => !optionalKeys.includes(key));
        for (const key of keys) {
            if (!requiredKeys.includes(key)) {
                return false;
            }
        }

        return true;
    }

    function isWeakTaskJson(obj: any): boolean {
        if (typeof obj === 'string') {
            return true;
        }

        if (typeof obj !== 'object') {
            return false;
        }

        return typeof obj.id === 'string' && typeof obj.text === 'string';
    }

    function isWeakColumnJson(obj: any): boolean {
        const mandatoryColKeys = ['title', 'tasks'] as const;
        const optionalColKeys = ['ntasks', 'id', 'color'] as const;

        if (!matchingKeys(obj, mandatoryColKeys, optionalColKeys)) {
            return false;
        }

        if (typeof obj.title !== 'string' || !Array.isArray(obj.tasks)) {
            return false;
        }

        for (const task of obj.tasks) {
            if (!isWeakTaskJson(task)) {
                return false;
            }
        }

        return true;
    }
}
