import React from 'react';
import vscodeHandler from '../util/vscode-handler';
import Column from './column';
import {DragDropContext, DropResult} from 'react-beautiful-dnd';
import {Toaster} from 'react-hot-toast';

class Board extends React.Component<{}, {savedData: StrictKanbanJSON}> {

    constructor(props: never) {
        super(props);
        this.state = {
            savedData: Board.defaultData
        };

        vscodeHandler.addLoadListener(data => this.setState({savedData: data}));
        vscodeHandler.load();
    }

    render(): JSX.Element {
        return (
            <div className='board'>
                <this.Titlebar/>
                <div className='board-content'>
                    <DragDropContext onDragEnd={(result) => this.dragEnd(result)}>
                        {this.state.savedData.cols.map((col, index) => {
                            const id = this.state.savedData.columnIds[index];
                            return <Column data={col} id={id} callback={(data) => this.columnCallback(data, id)}/>;
                        })}
                    </DragDropContext>
                </div>
                <Toaster/>
            </div>
        );
    }

    private dragEnd(result: DropResult): void {
        const {source, destination} = result;

        const getColumn = (id: string): StrictColumnJSON => {
            const index = this.state.savedData.columnIds.indexOf(id);
            return {...this.state.savedData.cols[index]};
        };

        const removeFromColumn = (column: StrictColumnJSON, index: number) => {
            const [text] = column.tasks.splice(index, 1);
            const [id] = column.taskIds.splice(index, 1);
            return [text, id];
        };

        const addToColumn = (column: StrictColumnJSON, index: number, text: string, id: string) => {
            column.tasks.splice(index, 0, text);
            column.taskIds.splice(index, 0, id);
        };

        const updateBoard = (column: StrictColumnJSON, columnId: string, column2?: StrictColumnJSON, columnId2?: string) => {
            const copy = {...this.state.savedData};
            const index = copy.columnIds.indexOf(columnId);
            copy.cols[index] = column;
            if (column2 && columnId2) {
                const index2 = copy.columnIds.indexOf(columnId2);
                copy.cols[index2] = column2;
            }
            this.setState({savedData: copy});
        };

        if (!destination) {
            return;
        }

        if (source.droppableId  === destination.droppableId) { //same column
            if (source.index === destination.index) {
                return;
            }

            const column = getColumn(source.droppableId);
            const [removedText, removedId] = removeFromColumn(column, source.index);
            addToColumn(column, destination.index, removedText, removedId);

            updateBoard(column, source.droppableId);
        } else {
            const sourceCol = getColumn(source.droppableId);
            const destCol = getColumn(destination.droppableId);

            const [removedText, removedId] = removeFromColumn(sourceCol, source.index);
            addToColumn(destCol, destination.index, removedText, removedId);

            updateBoard(sourceCol, source.droppableId, destCol, destination.droppableId);
        }
    }

    private columnCallback(data: StrictColumnJSON, id: string) {
        const index = this.state.savedData.columnIds.indexOf(id);
        const copy = {...this.state.savedData};
        copy.cols[index] = data;
        this.setState({savedData: copy});
    }

    private Titlebar = (): JSX.Element => {
        return (
            <div className='board-titlebar'>
                <h1> Kanban </h1>
                <button onClick={() => vscodeHandler.save(this.state.savedData)}> Save </button>
            </div>
        );
    };

    private static defaultData: StrictKanbanJSON = {
        cols: [
            {title: 'Bugs', tasks: [], taskIds: []},
            {title: 'To-Do',tasks: [''], taskIds: [Math.random().toString(36)]},
            {title: 'Doing', tasks: [], taskIds: []},
            {title: 'Done',  tasks: [], taskIds: []}
        ],
        columnIds: [
            Math.random().toString(36),
            Math.random().toString(36),
            Math.random().toString(36),
            Math.random().toString(36)
        ],
        settings: {autosave: false}
    };
}

export default Board;
