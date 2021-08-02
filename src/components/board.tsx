import React, { useState } from 'react';
import vscodeHandler from '../util/vscode-handler';
import Column from './column';
import {DragDropContext, DropResult} from 'react-beautiful-dnd';

function Board(): JSX.Element {

    const defaultData: StrictKanbanJSON = {
        cols: [
            {title: 'Bugs', tasks: [], taskIds: []},
            {title: 'To-Do',tasks: [''], taskIds: [Math.random().toString(36)]},
            {title: 'Doing', tasks: [], taskIds: []},
            {title: 'Done',  tasks: [], taskIds: []}
        ],
        columnIds: new Array(4).map(() => Math.random().toString(36)),
        settings: {autosave: false}
    };

    const [savedData, updateSavedData] = useState(defaultData);

    vscodeHandler.addLoadListener((data) => {
        updateSavedData(data);
    });

    

    const style = {
        backgroundColor: 'green'
    } as const;

    const columnRefs= new Map<string, React.RefObject<Column>>();

    function serialize(): StrictKanbanJSON {
        return {
            cols: savedData.columnIds.map(id => columnRefs.get(id)!.current!.serialize()),
            columnIds: savedData.columnIds,
            settings: savedData.settings
        };
    }

    function dragEnd(result: DropResult): void {
        const {source, destination} = result;

        if (!destination) {
            return;
        }

        if (source.droppableId  === destination.droppableId) { //same column
            if (source.index === destination.index) {
                return;
            }

            const column = columnRefs.get(source.droppableId)?.current;
            if (!column) {
                console.error("could not load column in dragend function");
                return;
            }

            let {tasks, taskIds} = column.serialize();

            const [removedText] = tasks.splice(source.index, 1);
            const [removedId] = taskIds.splice(source.index, 1);

            tasks.splice(destination.index, 0, removedText);
            taskIds.splice(destination.index, 0, removedId);

            column.updateTasks(tasks, taskIds);
        } else {
            const sourceCol = columnRefs.get(source.droppableId)?.current;
            const destCol = columnRefs.get(destination.droppableId)?.current;

            if (!sourceCol || !destCol) {
                console.error('could not load at least one column in dragend function');
                return;
            }

            let sourceJson = sourceCol.serialize();
            let destJson = destCol.serialize();

            const [removedText] = sourceJson.tasks.splice(source.index, 1);
            const [removedId] = sourceJson.taskIds.splice(source.index, 1);
            
            destJson.tasks.splice(destination.index, 0, removedText);
            destJson.taskIds.splice(destination.index, 0, removedId);

            sourceCol.updateTasks(sourceJson.tasks, sourceJson.taskIds);
            destCol.updateTasks(destJson.tasks, destJson.taskIds);
        }
    }

    function Titlebar(): JSX.Element {
        return (
            <div className='board-titlebar'>
                <h1> Kanban </h1>
                <button onClick={() => vscodeHandler.send('save', serialize())}> Save </button>
            </div>
        )
    }

    return (
        <div style={style} className='board'>
            <Titlebar/>
            <div className='board-content'>
                <DragDropContext onDragEnd={(result) => dragEnd(result)}>
                    {savedData?.cols.map((col, index) => {
                        const ref = React.createRef() as React.RefObject<Column>;
                        const key = savedData.columnIds[index];
                        columnRefs.set(key, ref);
                        return <Column initialState={col} id={key} ref={ref}/>;
                    })}
                </DragDropContext>
            </div>
        </div>
    );
}

export default Board;
