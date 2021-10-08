import React from 'react';
import Column from './column';
import { DragDropContext, DropResult } from 'react-beautiful-dnd';
import toast from 'react-hot-toast';
import { createStrictColumnJson, createStrictKanbanJson } from '../util/kanban-type-functions';
import VsCodeHandler from '../util/vscode-handler';
import { runInThisContext } from 'vm';

/**
 * A kanban board containing multiple Columns and Tasks that can be dragged to each column.
 */
class Board extends React.Component<{ vscode: VsCodeHandler }, { data: StrictKanbanJSON }> {

    /**
     * Creates the Board and loads a StrictKanbanJSON from the Extension Host
     */
    constructor(props: never) {
        super(props);
        this.state = {
            data: createStrictKanbanJson()
        };
    }

    componentDidMount() {
        this.props.vscode.addLoadListener(this.loadCallback);
        this.props.vscode.load();

        window.addEventListener('keydown', this.shortcutKeydown);
        window.addEventListener('keyup', this.shortcutKeyup);
        this.autosaveIntervalId = setInterval(() => {
            if (this.state.data.autosave && this.stateHasChanged) {
                this.stateHasChanged = false;
                this.props.vscode.save(this.state.data);
            }
        }, 5000);
    }

    componentWillUnmount() {
        this.props.vscode.removeLoadListener(this.loadCallback);
        window.removeEventListener('keydown', this.shortcutKeydown);
        window.removeEventListener('keyup', this.shortcutKeyup);
        if (this.autosaveIntervalId) {
            clearInterval(this.autosaveIntervalId);
        }
    }

    render(): JSX.Element {
        return (
            <div className='board'>
                <this.Titlebar />
                <div className='board-content'>
                    <DragDropContext onDragEnd={result => this.dragEnd(result)}>
                        {this.state.data.cols.map(col => (
                            <Column
                                data={col}
                                callback={data => this.columnCallback(data)}
                                numCols={this.state.data.cols.length}
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

        const getColumn = (id: string): StrictColumnJSON => {
            return this.state.data.cols.find(col => col.id === id)!;
        };

        const updateBoard = (column: StrictColumnJSON, column2?: StrictColumnJSON) => {
            const copy = { ...this.state.data };
            copy.cols = [...this.state.data.cols];
            const index = copy.cols.findIndex(col => col.id === column.id);
            copy.cols[index] = column;
            if (column2) {
                const index2 = copy.cols.findIndex(col => col.id === column2.id);
                copy.cols[index2] = column2;
            }
            this.updateSavedData(copy);
        };

        if (!destination) {
            return;
        }

        //droppableId is column, index is position in column
        if (source.droppableId === destination.droppableId) {
            if (source.index === destination.index) {
                return;
            }

            const column = getColumn(source.droppableId);
            const [removedTask] = column.tasks.splice(source.index, 1);
            column.tasks.splice(destination.index, 0, removedTask);

            updateBoard(column);
        } else {
            const sourceCol = getColumn(source.droppableId);
            const destCol = getColumn(destination.droppableId);

            const [removedTask] = sourceCol.tasks.splice(source.index, 1);
            destCol.tasks.splice(destination.index, 0, removedTask);

            updateBoard(sourceCol, destCol);
        }
    }

    /**
     * Updates the state of a Column with `data` or deletes a Column.
     * This method should be passed as callback to a Column, it should not be called on its own.
     * 
     * @param {StringColumnJSON | string} data updated state of a Column or the id of a Column to delete 
     */
    private columnCallback(data: StrictColumnJSON | string) {

        const copy = { ...this.state.data };
        copy.cols = [...this.state.data.cols];

        if (typeof data === 'string') { //delete column
            //notify user that a column was deleted and give them a chance to undo
            const oldData = { ...this.state.data };
            oldData.cols = [...this.state.data.cols];
            toast(t => (
                <div style={{
                    display: 'inline-flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                }}>
                    <p>Column Deleted &emsp;</p>
                    <a style={{ cursor: 'pointer' }} onClick={() => {
                        this.updateSavedData(oldData);
                        toast.dismiss(t.id);
                    }}>
                        Undo
                    </a>
                </div>
            ));

            const index = copy.cols.findIndex(col => col.id === data);
            copy.cols.splice(index, 1);
            this.updateSavedData(copy);
        } else { //update column
            const index = copy.cols.findIndex(col => col.id === data.id);
            copy.cols[index] = data;
            this.updateSavedData(copy);
        }
    }

    /**
     * React component containing the title of this Board and all its buttons (save, toggle autosave, settings)
     */
    private Titlebar = (): JSX.Element => {
        const [settingsVisible, setSettingsVisible] = React.useState(false);

        const settingsStyle = {
            opacity: settingsVisible ? 1 : 0,
            pointerEvents: settingsVisible ? 'all' : 'none',
            transition: 'opacity 0.3s'
        } as const;

        return (
            <div className='board-titlebar'>
                {/*Title and Buttons*/}
                <input className='board-title' maxLength={18} value={this.state.data.title} onChange={event => {
                    const copy = { ...this.state.data };
                    copy.title = event.target.value;
                    this.updateSavedData(copy);
                }} />
                <a className='board-save' title='Save' onClick={() => {
                    toast('Board Saved', { duration: 1000 });
                    this.props.vscode.save(this.state.data);
                }}>
                    <span className='codicon codicon-save' />
                </a>
                <a className='board-settings-toggle' title='Show/Hide Settings' onClick={() => setSettingsVisible(!settingsVisible)}>
                    <span className='codicon codicon-gear' />
                </a>

                {/*Settings Panel*/}
                <div className='board-settings' style={settingsStyle}>
                    <a className='board-autosave' onClick={() => {
                        const copy = { ...this.state.data };
                        copy.autosave = !copy.autosave;
                        toast(`Autosave ${copy.autosave ? 'Enabled' : 'Disabled'}`, { duration: 1000 });
                        this.updateSavedData(copy);
                    }}>
                        <span className={['codicon', this.state.data.autosave ? 'codicon-sync' : 'codicon-sync-ignored'].join(' ')} />
                    </a>
                    <p style={{ textDecoration: this.state.data.autosave ? 'none' : 'line-through' }}> Autosave </p>
                    <a className='board-save-file' onClick={() => {
                        const copy = { ...this.state.data };
                        copy.saveToFile = !copy.saveToFile;
                        toast(`Will save to ${copy.saveToFile ? '.vscode/kanban.json' : 'workspace metadata'}.`, { duration: 2000 });
                        this.updateSavedData(copy);
                    }}>
                        <span className={['codicon', this.state.data.saveToFile ? 'codicon-folder-active' : 'codicon-folder'].join(' ')} />
                    </a>
                    <p style={{ textDecoration: this.state.data.saveToFile ? 'none' : 'line-through' }}> Save to File </p>
                </div>
            </div>
        );
    };

    /**
     * Vertical bar on that adds a column to the board when clicked.
     */
    private AddColumnButton = (): JSX.Element => (
        <a className='board-add-column' title='Add Column' onClick={() => {
            const copy = { ...this.state.data };
            copy.cols.push(createStrictColumnJson(`Column ${copy.cols.length + 1}`));
            this.updateSavedData(copy);
        }}>
            <div className="vertical-line"></div>
            <span className='codicon codicon-add'></span>
            <div className="vertical-line"></div>
        </a>
    );


    /**
     * Update this Board's state, and save this state if autosave is on.
     * 
     * @param {StrictKanbanJSON} data new value of this.state.data 
     */
    private updateSavedData(data: StrictKanbanJSON) {
        this.stateHasChanged = true;
        this.setState({ data: data });
    }

    private loadCallback = (data: StrictKanbanJSON) => this.setState({ data: data });

    private shortcutKeys = { 's': false, 'Control': false };

    private shortcutKeydown = (event: KeyboardEvent) => {
        if (event.key === 'Control' || event.key === 's') {
            this.shortcutKeys[event.key] = true;
        }

        if (this.shortcutKeys['Control'] && this.shortcutKeys['s']) {
            this.props.vscode.save(this.state.data);
        }
    };

    private shortcutKeyup = (event: KeyboardEvent) => {
        if (event.key === 'Control' || event.key === 's') {
            this.shortcutKeys[event.key] = false;
        }
    };

    private stateHasChanged = false;
    private autosaveIntervalId: NodeJS.Timeout | undefined = undefined;
}

export default Board;
