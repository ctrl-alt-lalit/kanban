/**
 * @file Manages saving and loading the Kanban board.
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { isWeakKanbanJson } from '../util/kanban-types';

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

        let fileData = null;
        for (const saveUri of this.saveUris) {
            try {
                const buffer = await vscode.workspace.fs.readFile(saveUri);
                fileData = JSON.parse(buffer.toString());
                if (!isWeakKanbanJson(fileData)) {
                    continue;
                }
                this.preferredUri = saveUri;
                break;
            } catch {
                /*
                 * File not found.
                 *
                 * This is not actually ~exceptional~ ; however, vscode's
                 * filesystem api doesn't have a "check if the file exists" function.
                 */
            }
        }

        if (!mementoData) {
            return fileData;
        } else if (!fileData) {
            return mementoData;
        }

        const mementoTime = mementoData?.timestamp ?? -1;
        const fileTime = fileData?.timestamp ?? -1;
        return fileTime >= mementoTime ? fileData : mementoData;
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
