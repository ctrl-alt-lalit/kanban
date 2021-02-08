
import * as vscode from 'vscode'; //contains the VS Code extensibility API
import * as path from "path"; //make path names
import * as fs from "fs"; //file I/O
var sprintf = require("sprintf-js").sprintf; //format strings (like C)


//this method is called when your extension is activated
//your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	let view = vscode.commands.registerCommand("kanban-board.view", () => {
		const panel = vscode.window.createWebviewPanel(
			"kanban-board", //id
			"Kanban Board", //title
			vscode.ViewColumn.One, //open at first (leftmost) tab
			{
				enableScripts: true //allow JS to be used in webview
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
		console.log(webview.html);

	});

	context.subscriptions.push(view);
}



// this method is called when your extension is deactivated
export function deactivate() {}
