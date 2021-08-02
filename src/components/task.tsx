import React from 'react';
import TextAreaAutosize from 'react-textarea-autosize';
import ReactMarkdown from 'react-markdown';
import { Draggable, DraggableProvided, DraggableStateSnapshot, DraggingStyle, NotDraggingStyle } from 'react-beautiful-dnd';


function simpleHash(str: string, salt: number): string {
    let hash = Math.round(salt);
    for (let i = 0; i < str.length; ++i) {
        const ch = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + ch;
        hash = hash & hash;
    }
    return hash.toString(36);
}


function Task ({text, index, id, callback}:{text: string, index: number, id: string, callback: (text: string)=>void}) {

    const [editing, setEditing] = React.useState(false);

    return (
        <Draggable
            key={id}
            draggableId={id}
            index={index}
        >
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    className={['task', snapshot.isDragging ? 'drag' : ''].join(' ')}
                >
                    <div className='task-handle' {...provided.dragHandleProps}/>
                    <TextAreaAutosize
                        className='task-edit task-section'
                        value={text}
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
                            {text || '_enter markdown here_'}
                        </ReactMarkdown>
                    </div>
                </div>
            )}
        </Draggable>
    );
}

//TODO: get save button to retrieve data from all items
export default Task;