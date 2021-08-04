import React from 'react';
import ReactDOM from 'react-dom';
import { Toaster } from 'react-hot-toast';
import Board from './components/board';


function App(): JSX.Element {
    return (
        <>
        <Board/>
        <Toaster toastOptions={{duration: 2000, style: {
            borderRadius: '10px',
            backgroundColor: 'var(--vscode-editor-background)',
            color: 'var(--vscode-editor-foreground)'
        }}}/>
        </>
    );
}

ReactDOM.render(<App/>, document.getElementById('root'));