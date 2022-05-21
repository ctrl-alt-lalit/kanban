/**
 * @file Entry point for the extension. Tells VSCode how to activate the extension and what UI elements to update so the user can use the extension.
 */

import * as vscode from 'vscode'; //contains the VS Code extension API
import Panel from './panel';

/**
 * This is executed every time VSCode is opened and the extension is initialized/activated.
 * Gives VSCode a "view board" command and reads extension settings.
 */
export function activate(context: vscode.ExtensionContext) {
    const viewCommand = 'kanban.view';
    context.subscriptions.push(
        vscode.commands.registerCommand(viewCommand, () => Panel.show(context))
    );

    let config = vscode.workspace.getConfiguration('kanban');

    let viewButton = createViewButton(
        config.statusButton.alignment,
        config.statusButton.priority,
        viewCommand
    );
    if (viewButton) {
        viewButton.show();
        context.subscriptions.push(viewButton);
    }

    vscode.workspace.onDidChangeConfiguration((event) => {
        if (event.affectsConfiguration('kanban.statusButton')) {
            if (viewButton) {
                viewButton.hide();
            }

            config = vscode.workspace.getConfiguration('kanban');
            viewButton = createViewButton(
                config.statusButton.alignment,
                config.statusButton.priority,
                viewCommand
            );
            if (viewButton) {
                viewButton.show();
                context.subscriptions.push(viewButton);
            }
        }
    });
}

/**
 * Tells VSCode to create a "Kanban" button on the status bar.
 *
 * @param {string} alignment where the button should be: left, right, or nowhere
 * @param {number} priority where the button should be in relation to other buttons
 * @param {string} viewCommand command parsed by VSCode to open the Kanban extension
 */
function createViewButton(
    alignment: 'None' | 'Left' | 'Right',
    priority: number,
    viewCommand: string
) {
    if (alignment !== 'None') {
        const buttonAlignment =
            alignment === 'Left' ? vscode.StatusBarAlignment.Left : vscode.StatusBarAlignment.Right;

        const viewButton = vscode.window.createStatusBarItem(buttonAlignment, priority);

        viewButton.command = viewCommand;
        viewButton.text = '$(project) Kanban';

        return viewButton;
    }

    return null;
}

export function deactivate() {}
