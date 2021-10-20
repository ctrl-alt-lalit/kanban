import * as path from 'path';
import * as vscode from 'vscode'; //contains the VS Code extension API

// extension is activated the very first time a command is executed
export function activate(context: vscode.ExtensionContext) {
	const viewCommand = 'kanban.view';
	context.subscriptions.push(vscode.commands.registerCommand(
		viewCommand, () => Panel.show(context)));

	let config = vscode.workspace.getConfiguration('kanban');

	const createViewButton = (alignment: 'None' | 'Left' | 'Right', priority: number) => {
		if (alignment !== 'None') {
			const buttonAlignment = (alignment === 'Left')
				? vscode.StatusBarAlignment.Left
				: vscode.StatusBarAlignment.Right;

			const viewButton = vscode.window.createStatusBarItem(buttonAlignment, priority);

			viewButton.command = viewCommand;
			viewButton.text = '$(project) Kanban';

			return viewButton;
		}

		return null;
	};

	let viewButton = createViewButton(config.statusButton.alignment, config.statusButton.priority);
	if (viewButton) {
		viewButton.show();
		context.subscriptions.push(viewButton);
	}

	vscode.workspace.onDidChangeConfiguration(event => {
		if (event.affectsConfiguration('kanban.statusButton')) {
			if (viewButton) {
				viewButton.hide();
			}

			config = vscode.workspace.getConfiguration('kanban');
			viewButton = createViewButton(config.statusButton.alignment, config.statusButton.priority);
			if (viewButton) {
				viewButton.show();
				context.subscriptions.push(viewButton);
			}
		}
	});
}

class Panel {
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

	private constructor(context: vscode.ExtensionContext,
		column: vscode.ViewColumn) {
		this.extensionPath = context.extensionPath;
		const workspaceFolders =
			vscode.workspace.workspaceFolders ?? [undefined];
		this.storage = new Storage(context.workspaceState,
			workspaceFolders[0]?.uri.fsPath);
		this.webviewPanel =
			vscode.window.createWebviewPanel('kanban', 'Kanban', column, {
				enableScripts: true,
				localResourceRoots: [vscode.Uri.file(this.extensionPath)],
				retainContextWhenHidden: true
			});

		this.webviewPanel.webview.html = this.makeHtml();
		this.webviewPanel.onDidDispose(() => this.dispose(), null,
			this.disposables);
		this.webviewPanel.webview.onDidReceiveMessage(
			message => this.receiveMessage(message),
		);
	}

	private dispose() {
		this.webviewPanel.dispose();
		this.disposables.reverse();
		this.disposables.forEach(disposable => {
			if (disposable) {
				disposable.dispose();
			}
		});
		this.disposables = [];
		Panel.current = undefined;
	}

	private makeHtml(): string {
		const manifest = require(
			path.join(this.extensionPath, 'build', 'asset-manifest.json'));
		const csp = this.webviewPanel.webview.cspSource;
		const scriptSource = vscode.Uri.file(path.join(this.extensionPath, 'build', manifest.files['main.js'])).with({ scheme: 'vscode-resource' });
		const stylesheet = vscode.Uri.file(path.join(this.extensionPath, 'build', 'index.css')).with({ scheme: 'vscode-resource' });
		const codicons = vscode.Uri.file(path.join(this.extensionPath, 'node_modules', '@vscode', 'codicons', 'dist', 'codicon.css')).with({ scheme: 'vscode-resource' });
		const reactMenu = vscode.Uri.file(path.join(this.extensionPath, 'node_modules', '@szhsin', 'react-menu', 'dist', 'index.css')).with({ scheme: 'vscode-resource' });

		return (`
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
			`);
	}

	private async receiveMessage(message: { command: string, data: any }):
		Promise<void> {
		const { command, data } = message;
		if (command === 'save') {
			this.storage.saveKanban(data);
		} else if (command === 'load') {
			const savedData = await this.storage.loadKanban();
			this.webviewPanel.webview.postMessage(
				{ command: 'load', data: savedData });
		}
	}
}

class Storage {
	constructor(memento: vscode.Memento, workspacePath: string | undefined) {
		this.memento = memento;
		if (workspacePath) {
			this.saveUri = vscode.Uri.file(
				path.join(workspacePath, '.vscode', 'kanban.json'));
		}
	}

	public async loadKanban<T>(): Promise<T> {
		const mementoData =
			this.memento.get<T>(Storage.kanbanKey, null as any) as any;
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
		return (fileTime >= mementoTime) ? fileData : mementoData;
	}

	public saveKanban<T>(data: T) {
		const kanban = data as any;
		if (!kanban?.saveToFile || !this.saveUri) {
			this.memento.update(Storage.kanbanKey, kanban);
			return;
		}

		try {
			const buffer: Uint8Array =
				Buffer.from(JSON.stringify(kanban, null, 4));
			vscode.workspace.fs.writeFile(this.saveUri, buffer);
		} catch {
			console.error(
				'Could not save to file. Writing to metadata instead.');
			this.memento.update(Storage.kanbanKey, kanban);
		}
	}

	private memento: vscode.Memento;
	private static kanbanKey = 'columns';
	private saveUri: vscode.Uri | undefined = undefined;
}

export function deactivate() { }