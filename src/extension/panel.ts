import * as vscode from 'vscode';
import * as path from 'path';
import Storage from './storage';
import { ApiMessage } from '../util/vscode-handler';

export default class Panel {
    static show(context: vscode.ExtensionContext) {
        const column = vscode.window.activeTextEditor?.viewColumn;

        if (Panel.current) {
            Panel.current.webviewPanel.reveal(column);
        } else {
            this.current = new Panel(context, column ?? vscode.ViewColumn.One);
        }
    }

    private static current: Panel | undefined = undefined;
    private readonly webviewPanel: vscode.WebviewPanel;
    private storage: Storage;
    private extensionPath: string;
    private disposables: vscode.Disposable[] = [];

    private constructor(context: vscode.ExtensionContext, column: vscode.ViewColumn) {
        this.extensionPath = context.extensionPath;
        const workspaceFolders = vscode.workspace.workspaceFolders ?? [undefined];
        const savePaths = vscode.workspace.getConfiguration('kanban').saveFiles
            .pathPreferences as unknown as string[];
        this.storage = new Storage(
            context.workspaceState,
            workspaceFolders[0]?.uri.fsPath,
            savePaths
        );
        this.webviewPanel = vscode.window.createWebviewPanel('kanban', 'Kanban', column, {
            enableScripts: true,
            localResourceRoots: [vscode.Uri.file(this.extensionPath)],
            retainContextWhenHidden: true,
        });

        // initialize default hmtml and color theme
        this.webviewPanel.webview.html = this.makeHtml();
        this.webviewPanel.webview.postMessage({
            command: 'theme-changed',
            data: vscode.window.activeColorTheme.kind,
        });

        // have webview listen for events from vscode
        this.webviewPanel.onDidDispose(() => this.dispose(), null, this.disposables);
        this.webviewPanel.webview.onDidReceiveMessage((message) => this.receiveMessage(message));
        vscode.window.onDidChangeActiveColorTheme((e) => {
            this.webviewPanel.webview.postMessage({
                command: 'theme-changed',
                data: e.kind,
            });
        });
    }

    private dispose() {
        this.webviewPanel.dispose();
        this.disposables.reverse();
        this.disposables.forEach((disposable) => {
            if (disposable) {
                disposable.dispose();
            }
        });
        this.disposables = [];
        Panel.current = undefined;
    }

    private makeHtml(): string {
        const csp = this.webviewPanel.webview.cspSource;
        const scriptSource = vscode.Uri.file(
            path.join(this.extensionPath, 'build', 'main.js')
        ).with({ scheme: 'vscode-resource' });
        const stylesheet = vscode.Uri.file(path.join(this.extensionPath, 'build', 'main.css')).with(
            { scheme: 'vscode-resource' }
        );
        const codicons = vscode.Uri.file(
            path.join(
                this.extensionPath,
                'node_modules',
                '@vscode',
                'codicons',
                'dist',
                'codicon.css'
            )
        ).with({ scheme: 'vscode-resource' });
        const reactMenu = vscode.Uri.file(
            path.join(
                this.extensionPath,
                'node_modules',
                '@szhsin',
                'react-menu',
                'dist',
                'index.css'
            )
        ).with({ scheme: 'vscode-resource' });

        return `
			<!DOCTYPE html>
			<html lang="en-US">
			<head>
				<meta charset="utf-8">
				<meta name="viewport" content="width=device-width,initial-scale=1,shrink-to-fit=no">
				<meta name="theme-color" content="#000000">
				<title>React App</title>
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src ${csp}; style-src ${csp} 'unsafe-inline'; font-src ${csp}">
				<link rel="stylesheet" type="text/css" href="${stylesheet}"/>
				<link rel="stylesheet" type="text/css" href="${codicons}"/>
				<link rel="stylesheet" type="text/css" href="${reactMenu}"/>
			</head
			<body>
				<noscript> This extension needs JavaScript in order to run </noscript>
				<div id="root"></div>

				<script src="${scriptSource}"></script>
			</body>
			</html>
			`;
    }

    private async receiveMessage(message: ApiMessage): Promise<void> {
        const { command, data } = message;
        if (command === 'save') {
            this.storage.saveKanban(data);
        } else if (command === 'load') {
            const savedData = await this.storage.loadKanban();
            this.webviewPanel.webview.postMessage({
                command: 'load',
                data: savedData,
            });
        } else if (command === 'open-settings') {
            vscode.commands.executeCommand('workbench.action.openSettings', '@ext:lbauskar.kanban');
        }
    }
}
