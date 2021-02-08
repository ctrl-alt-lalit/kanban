
import * as vscode from 'vscode'; //contains the VS Code extensibility API
import { Memento } from "vscode";
import * as path from "path"; //make path names
import * as fs from "fs"; //file I/O
import { TextDecoder, TextEncoder } from 'util';
var sprintf = require("sprintf-js").sprintf; //format strings (like C)


//this method is called when your extension is activated
//your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	let storage = new StorageManager(context.workspaceState);

	let view = vscode.commands.registerCommand("kanban-board.view", () => {
		const panel = vscode.window.createWebviewPanel(
			"kanban-board", //id
			"Kanban Board", //title
			vscode.ViewColumn.One, //open at first (leftmost) tab
			{
				enableScripts: true, //allow JS to be used in webview
				retainContextWhenHidden: true //TODO: replace with get/setState at some point
			}
		);
		const webview = panel.webview;
		
		//load board.html into string
		const htmlPath = path.join(context.extensionPath, "src", "board", "index.html");
		const htmlUri = vscode.Uri.file(htmlPath).with({scheme: "vscode-resource"}); 
		const htmlString = fs.readFileSync(htmlUri.fsPath, "utf8");
		
		//load css and js URIs
		const cssPath = vscode.Uri.joinPath(context.extensionUri, "src", "board", "index.css");
		const cssUri = webview.asWebviewUri(cssPath);

		const jsPath = vscode.Uri.joinPath(context.extensionUri, "src", "board", "index.js");
		const jsUri = webview.asWebviewUri(jsPath);

		//attach URIs to html string and render
		webview.html = sprintf(htmlString, webview.cspSource.toString(), webview.cspSource.toString(), cssUri.toString(), jsUri.toString());

		createBoard(storage, webview);

		webview.onDidReceiveMessage(message => {
			switch(message.command) {
				case "save":
					storage.store("columns", message.data);
					break;
			}
		});
	});

	context.subscriptions.push(view);
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
						"Put text here!"
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
