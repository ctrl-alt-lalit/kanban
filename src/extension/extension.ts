import * as vscode from 'vscode'; //contains the VS Code extension API
import Panel from './panel';

// extension is activated the very first time a command is executed
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

function createViewButton(
    alignment: 'None' | 'Left' | 'Right',
    priority: number,
    viewCommand: string
) {
    if (alignment !== 'None') {
        const buttonAlignment =
            alignment === 'Left'
                ? vscode.StatusBarAlignment.Left
                : vscode.StatusBarAlignment.Right;

        const viewButton = vscode.window.createStatusBarItem(
            buttonAlignment,
            priority
        );

        viewButton.command = viewCommand;
        viewButton.text = '$(project) Kanban';

        return viewButton;
    }

    return null;
}

export function deactivate() {}
