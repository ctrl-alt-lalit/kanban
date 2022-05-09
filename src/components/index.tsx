import React from 'react';
import ReactDOM from 'react-dom';
import toast, { Toaster, useToasterStore } from 'react-hot-toast';
import Board from './board';
import RevisionHistory from './revision-history';

import './index.css';

function App(): JSX.Element {
    const { toasts } = useToasterStore();
    const TOAST_LIMIT = 2;
    React.useEffect(() => {
        toasts
            .filter((t) => t.visible)
            .filter((_, i) => i >= TOAST_LIMIT)
            .forEach((t) => toast.dismiss(t.id));
    }, [toasts]);

    return (
        <>
            <Board />
            <RevisionHistory />
            <Toaster
                toastOptions={{
                    duration: 2000,
                    position: 'bottom-center',
                    style: {
                        borderRadius: '1.25rem',
                        backgroundColor: 'var(--vscode-editor-background)',
                        color: 'var(--vscode-editor-foreground)',
                        height: '1.25rem',
                    },
                }}
            />
        </>
    );
}

ReactDOM.render(<App />, document.getElementById('root'));
