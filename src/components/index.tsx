/**
 * @file Entry point for Kanban UI. This element is what gets attached to the webview.
 */
import React from 'react';
import { createRoot } from 'react-dom/client';
import toast, { Toaster, useToasterStore } from 'react-hot-toast';
import Board from './board';
import RevisionHistory from './revision-history';

import './index.css';
import SettingsPanel from './settings-panel';

/**
 * Root element for entire Kanban GUI. Also manages communication between Board, Settings, and Revision History.
 */
function App(): JSX.Element {
    const { toasts } = useToasterStore();
    const TOAST_LIMIT = 2;
    React.useEffect(() => {
        toasts
            .filter((t) => t.visible)
            .filter((_, i) => i >= TOAST_LIMIT)
            .forEach((t) => toast.dismiss(t.id));
    }, [toasts]);

    const [settingsOpen, setSettingsOpen] = React.useState(false);
    const [historyOpen, setHistoryOpen] = React.useState(false);

    return (
        <>
            <SettingsPanel isOpen={settingsOpen} closeSettings={() => setSettingsOpen(false)} />
            <Board
                toggleSettings={() => setSettingsOpen(!settingsOpen)}
                toggleHistory={() => setHistoryOpen(!historyOpen)}
            />
            <RevisionHistory isOpen={historyOpen} closeHistory={() => setHistoryOpen(false)} />
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

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
