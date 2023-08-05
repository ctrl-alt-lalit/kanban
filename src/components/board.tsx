/**
 * @file Component containing containing the main feature, an interactive Kanban Board! Has multiple {@link Column}s with {@link Task}s that can be dragged to each column.
 */

import React from 'react';
import Column from './column';
import { DragDropContext, DropResult } from 'react-beautiful-dnd';
import toast from 'react-hot-toast';
import { createKanbanJson, KanbanJson } from '../util/kanban-types';
import boardState from '../util/board-state';

/**
 * A kanban board containing multiple {@link Column}s and {@link Task}s that can be dragged to each column.
 */
export default class Board extends React.Component<
    { toggleSettings: () => void; toggleHistory: () => void },
    { data: KanbanJson; title: string; columnJustAdded: boolean }
> {
    /**
     * Gives Board temporary default values so it has something to display
     */
    constructor(props: any) {
        super(props);
        this.state = {
            data: createKanbanJson(),
            title: 'Kanban',
            columnJustAdded: false,
        };
    }

    /**
     * Adds listeners to boardState and keyboardShortcuts. Requests previously saved Kanban.
     */
    componentDidMount() {
        boardState.addKanbanChangeListener(this.loadCallback);
        boardState.refreshKanban();

        window.addEventListener('keypress', this.saveShortcut);
    }

    /**
     * Removes listeners.
     */
    componentWillUnmount() {
        boardState.removeKanbanChangeListener(this.loadCallback);
        window.removeEventListener('keypress', this.saveShortcut);
    }

    /**
     * @ignore
     */
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
                                justAdded={
                                    this.state.columnJustAdded &&
                                    index === this.state.data.cols.length - 1
                                }
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
     * @ignore
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
                    onBlur={() => boardState.setBoardTitle(this.state.title)}
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
                    onClick={this.props.toggleSettings}
                >
                    <span className="codicon codicon-gear" />
                </a>
                <a
                    className="board-history-open"
                    title="Show/Hide Revision History"
                    onClick={this.props.toggleHistory}
                >
                    <span className="codicon codicon-history"></span>
                </a>
            </div>
        );
    };

    /**
     * Vertical bar on that adds a column to the board when clicked.
     * @ignore
     */
    private AddColumnButton = (): JSX.Element => (
        <a className="board-add-column" title="Add Column" onClick={this.addColumnClickHandler}>
            <div className="vertical-line"></div>
            <span className="codicon codicon-add"></span>
            <div className="vertical-line"></div>
        </a>
    );

    private addColumnClickHandler = () => {
        boardState.addColumn();
        this.setState({ columnJustAdded: true });
        setTimeout(() => this.setState({ columnJustAdded: false }), 200);
    };

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
     * @ignore
     */
    private saveShortcut = (event: KeyboardEvent) => {
        if (event.ctrlKey && event.key === 's') {
            this.saveBoard();
        }
    };
}
