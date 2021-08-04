import React from 'react';
import { Droppable } from 'react-beautiful-dnd';
import toast from 'react-hot-toast';
import Task from './task';

function Column({data,callback}: {data: StrictColumnJSON, callback: (data: StrictColumnJSON | string) => void}) {

    function taskCallback(text: string | null, index: number) {
        let copy = {...data};
        if (text !== null) {
            copy.tasks[index].text = text;
        } else {
            const oldData = {...data};
            oldData.tasks = [...data.tasks];
            toast(t => (
                <div style={{
                    display: 'inline-flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                }}>
                    <p>Task Deleted &emsp;</p>
                    <a  style={{cursor: 'pointer'}} onClick={() => {
                        callback(oldData);
                        toast.dismiss(t.id);
                    }}>
                        Undo 
                    </a>
                </div>
            ));

            copy.tasks.splice(index, 1);
        }
        
        callback(copy);  
    }

    return (
        <div className='column'>
            <div className='column-titlebar'>
                <input value={data.title} maxLength={12} className='column-title' onChange={event => {
                    let copy = {...data};
                    copy.title = event.target.value;
                    callback(copy);
                }}/>
                <a className='column-add-task' title='Add Task' onClick={() => {
                    let copy = {...data};
                    copy.tasks.push({text: '', id: Math.random().toString(36)});
                    callback(copy);
                }}>
                    <span className='codicon codicon-empty-window'/>
                </a>
                <a className='column-delete' title='Delete Column' onClick={() => callback(data.id)}>
                    <span className='codicon codicon-remove'/>
                </a>
            </div>
            <Droppable droppableId={data.id} key={data.id}>
                {(provided, snapshot) => (
                    <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className= {['column-tasks', snapshot.isDraggingOver ? 'drag-over' : ''].join(' ')}
                    >
                        {data.tasks.map((task, index) => (
                            <Task data={task} index={index} callback={(str: string | null) => taskCallback(str, index)}/>
                        ))}
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>
        </div>
    );
}

export default Column;