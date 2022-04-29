import React from 'react';
import Column from './column';
import { DragDropContext, DropResult } from 'react-beautiful-dnd';
import toast from 'react-hot-toast';
import { createStrictKanbanJson } from '../util/kanban-type-functions';
import boardState from '../util/board-state';

/**
 * A kanban board containing multiple Columns and Tasks that can be dragged to each column.
 */
class Board extends React.Component<{}, { data: StrictKanbanJSON }> {
    /**
     * Creates the Board and loads a StrictKanbanJSON from the Extension Host
     */
    constructor(props: never) {
        super(props);
        this.state = {
            data: createStrictKanbanJson(),
        };
    }

    componentDidMount() {
        boardState.addKanbanChangeListener(this.loadCallback);
        boardState.refreshKanban();

        window.addEventListener('keypress', this.saveShortcut);
    }

    componentWillUnmount() {
        boardState.removeKanbanChangeListener(this.loadCallback);
        window.removeEventListener('keypress', this.saveShortcut);
    }

    render(): JSX.Element {
        return (
            <div className="board">
                <this.Titlebar />
                <div className="board-content">
                    <DragDropContext
                        onDragEnd={(result) => this.dragEnd(result)}
                    >
                        {this.state.data.cols.map((col, index) => (
                            <Column
                                data={col}
                                numCols={this.state.data.cols.length}
                                index={index}
                                key={col.id}
                            />
                        ))}
                    </DragDropContext>
                    <this.AddColumnButton />
                </div>
            </div>
        );
    }

    /**
     * Updates this Board's state to reflect the fact that a Task was moved.
     * This method is automatically called when a Task is dropped.
     *
     * @param {DropResult} result location Task was originally, and location Task should be moved to
     */
    private dragEnd(result: DropResult): void {
        const { source, destination } = result;

        if (!destination) {
            return;
        }

        boardState.moveTask(
            source.droppableId,
            destination.droppableId,
            source.index,
            destination.index
        );
    }

    /**
     * React component containing the title of this Board and all its buttons (save, toggle autosave, settings)
     */
    private Titlebar = (): JSX.Element => {
        const [settingsVisible, setSettingsVisible] = React.useState(false);

        const settingsStyle = {
            opacity: settingsVisible ? 1 : 0,
            pointerEvents: settingsVisible ? 'all' : 'none',
            transition: 'opacity 0.3s',
        } as const;

        return (
            <div className="board-titlebar">
                {/*Title and Buttons*/}
                <input
                    className="board-title"
                    maxLength={18}
                    value={this.state.data.title}
                    onChange={(event) => {
                        const title = event.target.value;
                        boardState.changeBoardTitle(title);
                    }}
                />
                <a
                    className="board-save"
                    title="Save"
                    onClick={() => this.saveBoard()}
                    style={{
                        position: 'relative',
                        pointerEvents: boardState.changedSinceSave
                            ? 'auto'
                            : 'none',
                    }}
                >
                    <span className="codicon codicon-save" />
                    <span
                        className="codicon codicon-pass-filled"
                        style={{
                            display: boardState.changedSinceSave ? 'none' : '',
                        }}
                    />
                </a>
                <a
                    className="board-history-open"
                    title="Show/Hide Revision History"
                    onClick={() =>
                        window.dispatchEvent(new CustomEvent('toggle-history'))
                    }
                >
                    <span className="codicon codicon-discard"></span>
                </a>
                <a
                    className="board-settings-toggle"
                    title="Show/Hide Settings"
                    onClick={() => setSettingsVisible(!settingsVisible)}
                >
                    <span className="codicon codicon-gear" />
                </a>

                {/*Settings Panel*/}
                <div className="board-settings" style={settingsStyle}>
                    <a
                        className="board-autosave"
                        onClick={() => {
                            const autosave = !this.state.data.autosave;
                            toast(
                                `Autosave ${autosave ? 'Enabled' : 'Disabled'}`,
                                { duration: 1000 }
                            );
                            boardState.changeAutosave(autosave);
                        }}
                    >
                        <span
                            className={[
                                'codicon',
                                this.state.data.autosave
                                    ? 'codicon-sync'
                                    : 'codicon-sync-ignored',
                            ].join(' ')}
                        />
                    </a>
                    <p
                        style={{
                            textDecoration: this.state.data.autosave
                                ? 'none'
                                : 'line-through',
                        }}
                    >
                        {' '}
                        Autosave{' '}
                    </p>
                    <a
                        className="board-save-file"
                        onClick={() => {
                            const saveToFile = !this.state.data.saveToFile;
                            toast(
                                `Will save to ${
                                    saveToFile
                                        ? '.vscode/kanban.json'
                                        : 'workspace metadata'
                                }.`,
                                { duration: 2000 }
                            );
                            boardState.changeSaveToFile(saveToFile);
                        }}
                    >
                        <span
                            className={[
                                'codicon',
                                this.state.data.saveToFile
                                    ? 'codicon-folder-active'
                                    : 'codicon-folder',
                            ].join(' ')}
                        />
                    </a>
                    <p
                        style={{
                            textDecoration: this.state.data.saveToFile
                                ? 'none'
                                : 'line-through',
                        }}
                    >
                        {' '}
                        Save to File{' '}
                    </p>
                </div>
            </div>
        );
    };

    /**
     * Vertical bar on that adds a column to the board when clicked.
     */
    private AddColumnButton = (): JSX.Element => (
        <a
            className="board-add-column"
            title="Add Column"
            onClick={() => boardState.addColumn()}
        >
            <div className="vertical-line"></div>
            <span className="codicon codicon-add"></span>
            <div className="vertical-line"></div>
        </a>
    );

    private loadCallback = (data: StrictKanbanJSON) =>
        this.setState({ data: data });

    private saveBoard() {
        toast('Board Saved', { duration: 1000 });
        boardState.save();
    }

    /**
     * Listens for 'Ctrl + S' to save
     * @param event a KeyboardEvent
     */
    private saveShortcut = (event: KeyboardEvent) => {
        if (event.ctrlKey && event.key === 's') {
            this.saveBoard();
        }
    };
}

export default Board;
