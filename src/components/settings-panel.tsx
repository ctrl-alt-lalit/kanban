/**
 * @file Toggleable component to display and edit board settings.
 */

import React from 'react';
import boardState from '../util/board-state';
import { KanbanJson } from '../util/kanban-types';
import vscodeHandler from '../util/vscode-handler';

/**
 * Toggleable panel to display and edit board settings.
 */
class SettingsPanel extends React.Component<
    { isOpen: boolean; closeSettings: () => void },
    {
        autosave: boolean;
        saveToFile: boolean;
    }
> {
    constructor(props: any) {
        super(props);

        this.state = { autosave: false, saveToFile: false };
    }

    /**
     * Adds listener to boardstate for potential settings changes that may come by way of {@link RevisionHistory} component.
     */
    componentDidMount() {
        boardState.addKanbanChangeListener(this.stateListener);
    }

    /**
     * Removes change listener.
     */
    componentWillUnmount() {
        boardState.removeKanbanChangeListener(this.stateListener);
    }

    render(): JSX.Element {
        const style = {
            // CSS styles so that this panel will 'swipe' open and closed
            maxWidth: this.props.isOpen ? '25%' : 0,
            transition: 'max-width 0.3s ease 0s',
            pointerEvents: this.props.isOpen ? 'all' : 'none',
        } as const;

        return (
            <div className="settings" style={style}>
                <div className="settings-titlebar">
                    <a onClick={this.props.closeSettings} title="Hide Settings">
                        <span className="codicon codicon-chevron-left" />
                        <h1> Settings </h1>
                    </a>
                </div>

                <h2>
                    <ToggleSwitch
                        isToggled={this.state.autosave}
                        onToggle={() => {
                            boardState.setAutosave(!this.state.autosave);
                            this.setState({ autosave: !this.state.autosave });
                        }}
                        id="settings-autosave"
                    />
                    <span className="label"> Autosave </span>
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
                    <span className="label"> Save to File </span>
                </h2>

                <h2>
                    <a
                        className="settings-link"
                        id="global-settings-link"
                        onClick={() => vscodeHandler.openExtensionSettings()}
                    >
                        <span className="codicon codicon-globe" />
                        Global Settings
                    </a>
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
}

export default SettingsPanel;

/**
 * @ignore
 */
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
                <span className="toggle-switch-button">
                    <span className={`codicon ${isToggled ? 'codicon-pass' : 'codicon-error'}`} />
                </span>
            </label>
        </>
    );
}
