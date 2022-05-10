import React from 'react';
import boardState from '../util/board-state';
import { KanbanJson } from '../util/kanban-types';

/**
 * React component showing a list of edits the user has made since the board was opened.
 */
class SettingsPanel extends React.Component<
    {},
    {
        open: boolean;
        autosave: boolean;
        saveToFile: boolean;
    }
> {
    /* Create the component and make it listen for open event */
    constructor(props: never) {
        super(props);

        this.state = { open: false, autosave: false, saveToFile: false };
        window.addEventListener('toggle-settings', this.toggleListener);
    }

    componentDidMount() {
        boardState.addKanbanChangeListener(this.stateListener);
    }

    componentWillUnmount() {
        boardState.removeKanbanChangeListener(this.stateListener);
        window.removeEventListener('toggle-settings', this.toggleListener);
    }

    render(): JSX.Element {
        const style = {
            // CSS styles so that this panel will 'swipe' open and closed
            maxWidth: this.state.open ? '25%' : 0,
            transition: 'max-width 0.3s ease 0s',
            pointerEvents: this.state.open ? 'all' : 'none',
        } as const;

        return (
            <div className="settings" style={style}>
                <div className="settings-titlebar">
                    <h1> Settings </h1>
                    <a onClick={() => this.setState({ open: false })} title="Hide Revision History">
                        <span className="codicon codicon-chevron-left"></span>
                    </a>
                </div>

                <a onClick={() => boardState.changeAutosave(!this.state.autosave)} title="autosave">
                    <span
                        className={`codicon ${
                            this.state.autosave ? 'codicon-sync' : 'codicon-sync-ignored'
                        }`}
                    ></span>
                </a>

                <a
                    onClick={() => boardState.changeSaveToFile(!this.state.saveToFile)}
                    title="save to file"
                >
                    <span
                        className={`codicon ${
                            this.state.saveToFile ? 'codicon-folder-active' : 'codicon-folder'
                        }`}
                    ></span>
                </a>
            </div>
        );
    }

    private stateListener = (kanban: KanbanJson) => {
        this.setState({
            autosave: kanban.autosave,
            saveToFile: kanban.saveToFile,
        });
    };
    /* Callback for when the open event is fired */
    private toggleListener = () => this.setState({ open: !this.state.open });
}

export default SettingsPanel;
