import React from 'react';
import Column from './column';
import { DragDropContext, DropResult } from 'react-beautiful-dnd';
import toast from 'react-hot-toast';
import { createKanbanJson, KanbanJson } from '../util/kanban-types';
import boardState from '../util/board-state';

/**
 * A kanban board containing multiple Columns and Tasks that can be dragged to each column.
 */
class Board extends React.Component<{}, { data: KanbanJson; title: string }> {
    /**
     * Creates the Board and loads a StrictKanbanJSON from the Extension Host
     */
    constructor(props: never) {
        super(props);
        this.state = {
            data: createKanbanJson(),
            title: 'Kanban',
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
                    <DragDropContext onDragEnd={(result) => this.dragEnd(result)}>
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
        return (
            <div className="board-titlebar">
                {/*Title and Buttons*/}
                <input
                    className="board-title"
                    maxLength={18}
                    value={this.state.title}
                    onChange={(event) => {
                        this.setState({ title: event.target.value });
                    }}
                    onBlur={() => boardState.changeBoardTitle(this.state.title)}
                />
                <a
                    className="board-save"
                    title="Save"
                    onClick={() => this.saveBoard()}
                    style={{
                        position: 'relative',
                        pointerEvents: boardState.changedSinceSave ? 'auto' : 'none',
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
                    className="board-settings-toggle"
                    title="Show/Hide Settings"
                    onClick={() => window.dispatchEvent(new CustomEvent('toggle-settings'))}
                >
                    <span className="codicon codicon-gear" />
                </a>
                <a
                    className="board-history-open"
                    title="Show/Hide Revision History"
                    onClick={() => window.dispatchEvent(new CustomEvent('toggle-history'))}
                >
                    <span className="codicon codicon-discard"></span>
                </a>
            </div>
        );
    };

    /**
     * Vertical bar on that adds a column to the board when clicked.
     */
    private AddColumnButton = (): JSX.Element => (
        <a className="board-add-column" title="Add Column" onClick={() => boardState.addColumn()}>
            <div className="vertical-line"></div>
            <span className="codicon codicon-add"></span>
            <div className="vertical-line"></div>
        </a>
    );

    private loadCallback = (data: KanbanJson) => {
        this.setState({ data: data, title: data.title });
    };

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
