import React from 'react';
import ReactDOM from 'react-dom';
import toast, { Toaster, useToasterStore } from 'react-hot-toast';
import Board from './components/board';
import VsCodeHandler from './util/vscode-handler';

declare var acquireVsCodeApi: () => VsCodeApi;
let vscode: VsCodeApi | null = null;
if (typeof acquireVsCodeApi === 'undefined') {
    console.error("Could not acquire VSCode API for Extension Host. Saving and loading won't work.");
    vscode = {
        getState: () => {return;},
        setState: () => {return;},
        postMessage: () => {return;}
    };
} else {
    vscode = acquireVsCodeApi();
}
const vsCodeHandler = new VsCodeHandler(vscode);

function App(): JSX.Element {
    const {toasts} = useToasterStore();
    const TOAST_LIMIT = 2;
    React.useEffect(() => {
        toasts
            .filter(t => t.visible)
            .filter((_, i) => i >= TOAST_LIMIT)
            .forEach(t => toast.dismiss(t.id));
    }, [toasts]);

    return (
        <>
        <Board vscode={vsCodeHandler}/>
        <Toaster toastOptions={{duration: 2000, style: {
            borderRadius: '1.25rem',
            backgroundColor: 'var(--vscode-editor-background)',
            color: 'var(--vscode-editor-foreground)',
            height: '1.25rem',
        }}}/>
        </>
    );
}

ReactDOM.render(<App/>, document.getElementById('root'));