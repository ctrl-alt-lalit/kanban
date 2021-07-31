import * as vscode from 'vscode'; //contains the VS Code extensibility API

type ColumnJSON = {
    title: string,
    ntasks: number,
    tasks: string[]
};


type KanbanJSON = {
    ncols: number,
    cols: ColumnJSON[],
    settings?: any
};

//extension is activated the very first time a command is executed
export function activate(context: vscode.ExtensionContext) {

	const config = vscode.workspace.getConfiguration('kanban');

	const viewCommand = 'kanban.view';
	context.subscriptions.push(
		vscode.commands.registerCommand(viewCommand, () => Panel.show(context))
	);

	if (config.showViewButton) {
		const viewButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
		viewButton.command = viewCommand;
		viewButton.text = 'Kanban';
		viewButton.show();
		context.subscriptions.push(viewButton);
	}
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
	private storage: StorageManager;
	private extensionPath: string;
	private disposables: vscode.Disposable[] = [];

	private constructor(context: vscode.ExtensionContext, column: vscode.ViewColumn) {
		this.extensionPath = context.extensionPath;
		this.storage = new StorageManager(context.workspaceState);
		this.webviewPanel = vscode.window.createWebviewPanel(
			'kanban',
			'React Panel',
			column,
			{
				enableScripts: true,
				localResourceRoots: [vscode.Uri.file(this.extensionPath + '/build')]
			}
		);
		
		this.webviewPanel.webview.html = this.makeHtml();
		this.webviewPanel.onDidDispose(() => this.dispose(), null, this.disposables);
		this.webviewPanel.webview.onDidReceiveMessage(
			message => this.receiveMessage(message),
			null,
			this.disposables
		);

		const savedData = this.storage.retrieve('columns');
		this.webviewPanel.webview.postMessage({command: 'load', data: savedData});
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
		const manifest = require(this.extensionPath + '/build/asset-manifest.json');

		const csp = this.webviewPanel.webview.cspSource;
		const scriptSource = vscode.Uri.file(this.extensionPath + '/build' + manifest.files['main.js']).with({scheme: 'vscode-resource'});
		const stylesheet = vscode.Uri.file(this.extensionPath + '/build/index.css').with({scheme: 'vscode-resource'});
		return (
			`
			<!DOCTYPE html>
			<html lang="en-US">
			<head>
				<meta charset="utf-8">
				<meta name="viewport" content="width=device-width,initial-scale=1,shrink-to-fit=no">
				<meta name="theme-color" content="#000000">
				<title>React App</title>
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src ${csp}; style-src ${csp}">
				<link rel="stylesheet" type="text/css" href="${stylesheet}"/>
			</head
			<body>
				<noscript> This extension needs JavaScript in order to run </noscript>
				<div id="root"></div>

				<script src="${scriptSource}"></script>
			</body>
			</html>
			`
		);
	}

	private receiveMessage(message: {command: string, data: any}): void {
		console.log(message);
		if (message.command === 'save') {
			this.storage.store('columns', message.data);
		}
	}
}

class StorageManager {
	constructor(memento: vscode.Memento) {
		this.memento = memento;
	}

	public retrieve<T>(key: string) : T {
		return this.memento.get<T>(key, null as any);
	}

	public store<T>(key: string, value: T) {
		this.memento.update(key, value);
	}

	private memento: vscode.Memento;
}

function createBoard(storage: StorageManager, webview: vscode.Webview) {
	let savedData: KanbanJSON = storage.retrieve('columns');
	// make example board if nothing is saved
	if (savedData === null) {
		savedData = {
			ncols: 4,
			cols: [
				{title: 'Bugs', ntasks: 0, tasks: []},
				{title: 'To-Do', ntasks: 1, tasks: ['']},
				{title: 'Doing', ntasks: 0, tasks: []},
				{title: 'Done', ntasks: 0, tasks: []}
			],
			settings: {autosave: false}
		};
	}

	webview.postMessage({
		command: 'load',
		data: savedData
	});
}
