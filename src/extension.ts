
import * as vscode from 'vscode'; //contains the VS Code extensibility API
import * as path from 'path'; //make path names
import * as fs from 'fs'; //file I/O
var sprintf = require('sprintf-js').sprintf; //format strings (like C)

type ColumnJSON = {title: string, ntasks: number, tasks: string[]};
type KanbanJSON = {ncols: number, cols: ColumnJSON[], settings?: any};

//extension is activated the very first time a command is executed
export function activate(context: vscode.ExtensionContext) {

	const config = vscode.workspace.getConfiguration('kanban');
	const storage = new StorageManager(context.workspaceState);

	const viewCmdId = 'kanban.view';
	const view = vscode.commands.registerCommand(viewCmdId, () => { // View the kanban board
	
		const panel = vscode.window.createWebviewPanel( //Create tab/window to view board in
			'kanban', //id
			'Kanban', //title
			vscode.ViewColumn.One, //open at first (leftmost) tab
			{
				enableScripts: true, //allow JS to be used in webview
				retainContextWhenHidden: true //TODO: replace with get/setState at some point
			}
		);
		const webview = panel.webview;
		
		//load board.html into string
		const extPath = context.extensionPath;
		const htmlPath = path.join(extPath, 'dist', 'view', 'board', 'board.html');
		const htmlUri = vscode.Uri.file(htmlPath).with({scheme: 'vscode-resource'}); 
		const htmlString = fs.readFileSync(htmlUri.fsPath, 'utf8');
		
		function loadResource(uriPath : string) {
			const uri = vscode.Uri.file(uriPath);
			return webview.asWebviewUri(uri);
		}

		//load css, js, and icon URIs
		const stylesheet = loadResource(path.join(extPath, 'dist', 'view', 'board', 'board.css'));
		const mainScript = loadResource(path.join(extPath, 'dist', 'view', 'board', 'board.js'));
		const icons = loadResource(path.join(extPath, 'node_modules', 'vscode-codicons', 'dist', 'codicon.css'));
		const iconFont = loadResource(path.join(extPath, 'node_modules', 'vscode-codicons', 'dist', 'codicon.ttf'));


		//attach URIs to html string and render html in webview
		const csp = webview.cspSource.toString();
		webview.html = sprintf(
			htmlString, csp, csp, csp, stylesheet.toString(), icons.toString(), iconFont.toString(), 
			vscode.workspace.name || 'Kanban Board', mainScript.toString()
		);

		createBoard(storage, webview); //load board from local storage

		webview.onDidReceiveMessage(message => { //save board to storage
			if (message.command === 'save') {
				storage.store('columns', message.data);
			}
		});
	});
	context.subscriptions.push(view);

	if (config.showViewButton) {
		const viewButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
		viewButton.command = viewCmdId;
		viewButton.text = 'Kanban';
		viewButton.show();
		context.subscriptions.push(viewButton);
	}
}

class StorageManager {
	constructor(private storage: vscode.Memento) {}

	public retrieve<T>(key: string) : T {
		return this.storage.get<T>(key, null as any);
	}

	public store<T>(key: string, value: T) {
		this.storage.update(key, value);
	}
}

function createBoard(storage: StorageManager, webview: vscode.Webview) {
	let savedData: KanbanJSON = storage.retrieve('columns');
	// make example board if nothing is saved
	if (savedData === null) {
		savedData = {
			ncols: 4,
			cols: [
				{
					title: 'Bugs',
					ntasks: 0,
					tasks: []
				},
				{
					title: 'To-Do',
					ntasks: 1,
					tasks: [
						'Add your own text here!'
					]
				},
				{
					title: 'Doing',
					ntasks: 0,
					tasks: []
				},
				{
					title: 'Done',
					ntasks: 0,
					tasks: []
				}
			],
			settings: {
				autosave: false
			}
		};
	}

	webview.postMessage({
		command: 'load',
		data: savedData
	});
}

// this method is called when your extension is deactivated
export function deactivate() {}
