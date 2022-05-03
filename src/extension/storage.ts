import * as vscode from 'vscode';
import * as path from 'path';

export default class Storage {
    constructor(memento: vscode.Memento, workspacePath: string | undefined) {
        this.memento = memento;
        if (workspacePath) {
            this.saveUri = vscode.Uri.file(
                path.join(workspacePath, '.vscode', 'kanban.json')
            );
        }
    }

    public async loadKanban<T>(): Promise<T> {
        const mementoData = this.memento.get<T>(
            Storage.kanbanKey,
            null as any
        ) as any;
        if (!this.saveUri) {
            return mementoData;
        }

        let fileData = null;
        try {
            const buffer = await vscode.workspace.fs.readFile(this.saveUri);
            fileData = JSON.parse(buffer.toString());
        } catch {
            /*
             * File not found.
             *
             * This is not actually ~exceptional~ since you can save
             * to the workspace rather than a discrete file. However, vscode's
             * filesystem api doesn't have a "check if the file exists" function.
             */
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

    public saveKanban<T>(data: T) {
        const kanban = data as any;
        if (!kanban?.saveToFile || !this.saveUri) {
            this.memento.update(Storage.kanbanKey, kanban);
            return;
        }

        try {
            const buffer: Uint8Array = Buffer.from(
                JSON.stringify(kanban, null, 4)
            );
            vscode.workspace.fs.writeFile(this.saveUri, buffer);
        } catch {
            console.error(
                'Could not save to file. Writing to metadata instead.'
            );
            this.memento.update(Storage.kanbanKey, kanban);
        }
    }

    private memento: vscode.Memento;
    private static kanbanKey = 'columns';
    private saveUri: vscode.Uri | undefined = undefined;
}
