import React from 'react';
import { Droppable } from 'react-beautiful-dnd';
import toast from 'react-hot-toast';
import Task from './task';

type ColumnTask = {text: string, id: string};

function Column({data, id, callback}: {data: StrictColumnJSON, id: string, callback: (data: StrictColumnJSON) => void}) {

    function taskCallback(text: string | null, index: number) {
        let copy = {...data};
        if (text !== null) {
            copy.tasks[index] = text;
        } else {
            const oldData: StrictColumnJSON = {
                title: copy.title,
                tasks: [...copy.tasks],
                taskIds: [...copy.taskIds]
            };

            copy.tasks.splice(index, 1);
            toast(t => (
                    <div style={{display: 'inline-flex', flexDirection: 'row'}}>
                        <p>Task Deleted</p>
                        <a onClick={() => {
                            callback(oldData);
                            toast.dismiss(t.id);
                        }}>
                            Undo 
                        </a>
                    </div>
            ), {
                className:'toast'
            });
        }
        
        callback(copy);  
    }

    return (
        <div className='column'>
            <div className='col-toolbar'>
                <h2>{data.title}</h2>
                <button onClick={() => {
                    let copy = {...data};
                    copy.tasks.push('');
                    copy.taskIds.push(Math.random().toString(36));
                    callback(copy);
                }}>
                    Add task
                </button>
            </div>
            <Droppable droppableId={id} key={id}>
                {(provided, snapshot) => (
                    <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className= {['column-tasks', snapshot.isDraggingOver ? 'drag-over' : ''].join(' ')}
                    >
                        {data.tasks.map((text, index) => (
                            <Task
                                text={text}
                                index={index}
                                id={data.taskIds[index]}
                                callback={(str: string | null) => taskCallback(str, index)}
                            />
                        ))}
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>
        </div>
    );
}

export default Column;