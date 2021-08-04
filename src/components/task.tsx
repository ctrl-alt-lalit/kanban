import React from 'react';
import TextAreaAutosize from 'react-textarea-autosize';
import ReactMarkdown from 'react-markdown';
import { Draggable } from 'react-beautiful-dnd';

function Task ({data, index, callback}:{data: {text: string, id: string}, index: number, callback: (text: string | null)=>void}) {

    const [editing, setEditing] = React.useState(false);

    return (
        <Draggable
            key={data.id}
            draggableId={data.id}
            index={index}
        >
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    className={['task', snapshot.isDragging ? 'drag' : ''].join(' ')}
                >
                    <div
                        className='task-handle'
                        {...provided.dragHandleProps}
                        onMouseDown={() => setEditing(false)}
                    >
                        <a className='task-delete' title='Delete Task' onClick={() => callback(null)}>
                            <span className='codicon codicon-close'/>
                        </a>
                    </div>
                    <TextAreaAutosize
                        className='task-edit task-section'
                        value={data.text}
                        onChange={(event) => callback(event.target.value)}
                        onBlur={() => setEditing(false)}
                        style={{display: editing ? 'block' : 'none'}}
                    />
                    <div
                        className='task-display task-section'
                        onClick={() => setEditing(true)}
                        style={{display: editing ? 'none' : 'block'}}
                    >
                        <ReactMarkdown>
                            {data.text || '_enter text or markdown here_'}
                        </ReactMarkdown>
                    </div>
                </div>
            )}
        </Draggable>
    );
}

export default Task;