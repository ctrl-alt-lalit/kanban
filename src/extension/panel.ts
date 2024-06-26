/**
 * @file Wrapper around a VSCode webview panel to make managing the webview's state and how to show the webview easier.
 */

import * as vscode from 'vscode';
import * as path from 'path';
import Storage from './storage';
import { ApiMessage } from '../util/vscode-handler';

/**
 * Handles the creation, destruction, and activation of the webview panel that contains the Kanban board.
 */
export default class Panel {
    /**
     * Displays a the Kanban webview panel, by either creating one or focusing on an existing one.
     *
     * @param {vscode.ExtensionContext} context Context recieved as a paramater in the {@link activate} function
     */
    static show(context: vscode.ExtensionContext) {
        const column = vscode.window.activeTextEditor?.viewColumn;

        if (Panel.current) {
            Panel.current.webviewPanel.reveal(column);
        } else {
            this.current = new Panel(context, column ?? vscode.ViewColumn.One);
        }
    }

    /***********
     * Private *
     ***********/
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

        // initialize default html and color theme
        this.webviewPanel.webview.html = this.makeHtml();
        this.sendSettings();

        // listen for events from vscode, use bespoke callbacks to avoid 'this' issues
        this.webviewPanel.onDidDispose(() => this.dispose(), null, this.disposables);
        this.webviewPanel.webview.onDidReceiveMessage((e) => this.receiveMessage(e));
        vscode.window.onDidChangeActiveColorTheme((e) => this.changeActiveColorTheme(e));
        vscode.workspace.onDidChangeConfiguration((e) => this.changeConfiguration(e));
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

    private async changeActiveColorTheme(theme: vscode.ColorTheme): Promise<void> {
        this.sendSettings(theme.kind);
    }

    private async changeConfiguration(change: vscode.ConfigurationChangeEvent): Promise<void> {
        if (change.affectsConfiguration('kanban')) {
            this.sendSettings();
        }
    }

    private async sendSettings(
        colorTheme?: vscode.ColorThemeKind,
        showScanlines?: boolean
    ): Promise<void> {
        colorTheme ??= vscode.window.activeColorTheme.kind;
        showScanlines ??= vscode.workspace.getConfiguration('kanban').showScanLines;

        this.webviewPanel.webview.postMessage({
            command: 'extension-settings-changed',
            data: {
                colorTheme: colorTheme.valueOf(),
                showScanlines: showScanlines ?? true,
            },
        });
    }
}
