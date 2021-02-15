
import * as vscode from 'vscode'; //contains the VS Code extensibility API
import { Memento } from "vscode";
import * as path from "path"; //make path names
import * as fs from "fs"; //file I/O
var sprintf = require("sprintf-js").sprintf; //format strings (like C)


//extension is activated the very first time a command is executed
export function activate(context: vscode.ExtensionContext) {

	const config = vscode.workspace.getConfiguration("kanban");
	const storage = new StorageManager(context.workspaceState);

	const viewCmdId = "kanban.view";
	const view = vscode.commands.registerCommand(viewCmdId, () => { // View the kanban board
	
		const panel = vscode.window.createWebviewPanel( //Create tab/window to view board in
			"kanban", //id
			"Kanban", //title
			vscode.ViewColumn.One, //open at first (leftmost) tab
			{
				enableScripts: true, //allow JS to be used in webview
				retainContextWhenHidden: true //TODO: replace with get/setState at some point
			}
		);
		const webview = panel.webview;
		
		//load board.html into string
		const htmlPath = path.join(context.extensionPath, "view", "board", "index.html");
		const htmlUri = vscode.Uri.file(htmlPath).with({scheme: "vscode-resource"}); 
		const htmlString = fs.readFileSync(htmlUri.fsPath, "utf8");
		
		function loadResource(path : string) {
			const uri = vscode.Uri.file(path);
			return webview.asWebviewUri(uri);
		}

		//load css, js, and icon URIs
		const stylesheet = loadResource(path.join(context.extensionPath, "view", "board", "index.css"));
		const mainScript = loadResource(path.join(context.extensionPath, "view", "board", "index.js"));
		const filterScript = loadResource(path.join(context.extensionPath, "view", "board", "filter.js"));

		const addColIcon = loadResource(path.join(context.extensionPath, "view", "icons", "add-column.png"));
		const deleteIcon = loadResource(path.join(context.extensionPath, "view", "icons", "delete.png"));
		const saveIcon = loadResource(path.join(context.extensionPath, "view", "icons", "save.png"));
		const delColIcon = loadResource(path.join(context.extensionPath, "view", "icons", "delete-column.png"));
		const addIcon = loadResource(path.join(context.extensionPath, "view", "icons", "add.png"));
		const undoIcon = loadResource(path.join(context.extensionPath, "view", "icons", "undo.png"));

		//attach URIs to html string and render html in webview
		webview.html = sprintf(
			htmlString, webview.cspSource.toString(), webview.cspSource.toString(), webview.cspSource.toString(),
			stylesheet.toString(), vscode.workspace.name || "Kanban Board", addColIcon.toString(),
			saveIcon.toString(), undoIcon.toString(), filterScript.toString(), mainScript.toString()
		);

		webview.postMessage({
			command: "icons",
			data: {
				delete: deleteIcon.toString(),
				delCol: delColIcon.toString(),
				add: addIcon.toString()
			}
		});

		createBoard(storage, webview); //load board from local storage

		webview.onDidReceiveMessage(message => { //save board to storage
			switch(message.command) {
				case "save":
					storage.store("columns", message.data);
					break;
			}
		});
	});
	context.subscriptions.push(view);

	if (config.showViewButton) {
		const viewButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
		viewButton.command = viewCmdId;
		viewButton.text = "Kanban";
		viewButton.show();
		context.subscriptions.push(viewButton);
	}
}

class StorageManager {
	constructor(private storage: Memento) {}

	public retrieve<T>(key: string) : T {
		return this.storage.get<T>(key, null as any);
	}

	public store<T>(key: string, value: T) {
		this.storage.update(key, value);
	}
}

function createBoard(storage: StorageManager, webview: vscode.Webview) {
	/*
	 * EXAMPLE OF COLUMNS OBJECT
	 * {
	 *  	ncols: 2,
	 *  	cols: [
	 *  		{
	 * 				title: "column 1"
	 * 				ntasks: 2,
	 * 				tasks: [
	 * 					"task 1",
	 * 					"task 2",
	 * 				]
	 * 			},
	 * 			{
	 * 				title: "example"
	 * 				ntasks: 3,
	 * 				tasks: [
	 * 					"foo",
	 * 					"bar",
	 * 					"baz"
	 * 				]
	 * 			},
	 * 		],
	 * }
	 */

	let columns = storage.retrieve("columns");
	if (columns === null) {
		columns = {
			ncols: 4,
			cols: [
				{
					title: "Bugs",
					ntasks: 0,
					tasks: []
				},
				{
					title: "To-Do",
					ntasks: 1,
					tasks: [
						"Add your own text here!"
					]
				},
				{
					title: "Doing",
					ntasks: 0,
					tasks: []
				},
				{
					title: "Done",
					ntasks: 0,
					tasks: []
				}
			]
		};
	}

	webview.postMessage({
		command: "load",
		data: columns
	});
}

// this method is called when your extension is deactivated
export function deactivate() {}
