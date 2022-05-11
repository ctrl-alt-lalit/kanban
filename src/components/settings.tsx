import React from 'react';
import boardState from '../util/board-state';
import { KanbanJson } from '../util/kanban-types';
import vscodeHandler from '../util/vscode-handler';

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
                    <a onClick={() => this.setState({ open: false })} title="Hide Revision History">
                        <span className="codicon codicon-chevron-left"></span>
                    </a>
                    <h1> Settings </h1>
                </div>

                <h2>
                    <ToggleSwitch
                        isToggled={this.state.autosave}
                        onToggle={() => {
                            boardState.setAutosave(!this.state.autosave);
                            this.setState({ autosave: !this.state.autosave });
                        }}
                        id="settings-autosave"
                    />{' '}
                    <span style={{ whiteSpace: 'nowrap' }}> Autosave </span>
                </h2>

                <h2>
                    <ToggleSwitch
                        isToggled={this.state.saveToFile}
                        onToggle={() => {
                            boardState.setSaveToFile(!this.state.saveToFile);
                            this.setState({ saveToFile: !this.state.saveToFile });
                        }}
                        id="settings-savefile"
                    />
                    <span style={{ whiteSpace: 'nowrap' }}> Save to File </span>
                </h2>

                <h2>
                    <a onClick={vscodeHandler.openExtensionSettings}> Open Global Settings </a>
                </h2>
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

function ToggleSwitch({
    isToggled,
    onToggle,
    id,
}: {
    isToggled: boolean;
    onToggle: () => void;
    id: string;
}): JSX.Element {
    const bgColor = isToggled
        ? 'var(--vscode-editor-selectionBackground)'
        : 'var(--vscode-scrollbarSlider-background)';
    return (
        <>
            <input
                checked={isToggled}
                onChange={onToggle}
                id={id}
                className="toggle-switch"
                type="checkbox"
            />
            <label className="toggle-switch-label" htmlFor={id} style={{ background: bgColor }}>
                <span className={'toggle-switch-button'} />
            </label>
        </>
    );
}
