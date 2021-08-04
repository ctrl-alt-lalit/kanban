import React from 'react';
import vscodeHandler from '../util/vscode-handler';
import Column from './column';
import {DragDropContext, DropResult} from 'react-beautiful-dnd';
import toast from 'react-hot-toast';

function randomString() {
    return Math.random().toString(36);
}

class Board extends React.Component<{}, {savedData: StrictKanbanJSON}> {

    constructor(props: never) {
        super(props);
        this.state = {
            savedData: Board.defaultData
        };

        vscodeHandler.addLoadListener(data => this.updateSavedData(data));
        vscodeHandler.load();
    }

    render(): JSX.Element {
        return (
            <div className='board'>
                <this.Titlebar/>
                <div className='board-content'>
                    <DragDropContext onDragEnd={(result) => this.dragEnd(result)}>
                        {this.state.savedData.cols.map(col => {
                            return <Column data={col} callback={data => this.columnCallback(data)}/>;
                        })}
                    </DragDropContext>
                </div>
            </div>
        );
    }

    private dragEnd(result: DropResult): void {
        const {source, destination} = result;

        const getColumn = (id: string): StrictColumnJSON => {
            return this.state.savedData.cols.find(col => col.id === id)!;
        };

        const updateBoard = (column: StrictColumnJSON, column2?: StrictColumnJSON) => {
            const copy = {...this.state.savedData};
            copy.cols = [...this.state.savedData.cols];
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

        if (source.droppableId  === destination.droppableId) { //same column
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

    private columnCallback(data: StrictColumnJSON | string) {

        const copy = {...this.state.savedData};
        copy.cols = [...this.state.savedData.cols];

        if (typeof data === 'string') {
            const oldData = {...this.state.savedData};
            oldData.cols = [...this.state.savedData.cols];
            toast(t => (
                <div style={{
                    display: 'inline-flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                }}>
                    <p>Column Deleted &emsp;</p>
                    <a  style={{cursor: 'pointer'}} onClick={() => {
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
        } else {
            const index = copy.cols.findIndex(col => col.id === data.id);
            copy.cols[index] = data;
            this.updateSavedData(copy);
        }
    }

    private Titlebar = (): JSX.Element => {
        return (
            <div className='board-titlebar'>
                <input className='board-title' maxLength={18} value={this.state.savedData.title} onChange={event => {
                    const copy = {...this.state.savedData};
                    copy.title = event.target.value;
                    this.updateSavedData(copy);
                }}/>
                <a className='board-save' title='Save' onClick={() => vscodeHandler.save(this.state.savedData)}>
                    <span className='codicon codicon-save'/>
                </a>
                <a className='board-autosave' title='Toggle Autosave' onClick={() => {
                    const copy = {...this.state.savedData};
                    copy.autosave = !copy.autosave;
                    this.updateSavedData(copy);
                }}>
                    <span className={['codicon', this.state.savedData.autosave ? 'codicon-sync' : 'codicon-sync-ignored'].join(' ')}/>
                </a>
                <a className='board-add-column' title='Add Column' onClick={() => {
                    const copy = {...this.state.savedData};
                    const newCol: StrictColumnJSON = {title: `Column ${copy.cols.length + 1}`, tasks: [], id: randomString()};
                    copy.cols.push(newCol);
                    this.updateSavedData(copy);
                }}>
                    <span className='codicon codicon-add'/>
                </a>
            </div>
        );
    };

    private static defaultData: StrictKanbanJSON = {
        title: 'Kanban',
        cols: [
            {title: 'Bugs', tasks: [], id: randomString()},
            {title: 'To-Do',tasks: [{text: '', id: randomString()}], id: randomString()},
            {title: 'Doing', tasks: [], id: randomString()},
            {title: 'Done',  tasks: [], id: randomString()}
        ],
        autosave: false
    };

    private updateSavedData(data: StrictKanbanJSON) {
        if (data.autosave) {
            vscodeHandler.save(data);
        }
        this.setState({savedData: data});
    }
}

export default Board;
