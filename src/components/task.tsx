import React from 'react';
import TextAreaAutosize from 'react-textarea-autosize';
import ReactMarkdown from 'react-markdown';
import { Draggable } from 'react-beautiful-dnd';
import boardState from '../util/board-state';
import DelayedUpdater from '../util/delayed-updater';


/**
 * React component showing editable text that is rendered in markdown. This component can be dragged to different Columns.
 * 
 * @prop data - TaskJSON this Task will represent
 * @prop index - position of this Task in a list of Tasks
 * @prop callback - (string | null) => void -- notifies parent Column whenever Task state is updated.
 * A string will be the new text this Task displays. null means this Task should be deleted.
 */
function Task({ data, index, columnId }: { data: TaskJSON, index: number, columnId: string }): JSX.Element {

    const [editing, setEditing] = React.useState(false);

    return (
        <Draggable
            key={data.id}
            draggableId={data.id}
            index={index}
        >
            {(provided, snapshot) => (
                //draggable container for the task (see react-beautiful-dnd)
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    className={['task', snapshot.isDragging ? 'drag' : ''].join(' ')}
                >
                    {/* 'Handle' user must click on to move the whole Task (react-beautiful-dnd) */}
                    <div
                        className='task-handle'
                        {...provided.dragHandleProps}
                        onMouseDown={() => setEditing(false)}
                    >
                        <a className='task-delete' title='Delete Task' onClick={() => boardState.removeTask(columnId, data.id)}>
                            <span className='codicon codicon-close' />
                        </a>
                    </div>

                    {/* Main content. Autosizing textbox or text rendered as markdown */}
                    <TextAreaAutosize
                        className='task-edit task-section'
                        value={data.text}
                        onChange={event => {
                            const text = event.target.value;
                            boardState.changeTaskText(columnId, data.id, text);
                        }}
                        onBlur={() => setEditing(false)}
                        style={{ display: editing ? 'block' : 'none' }}
                    />
                    <div
                        className='task-display task-section'
                        onClick={() => setEditing(true)}
                        style={{ display: editing ? 'none' : 'block' }}
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