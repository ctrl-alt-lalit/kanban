import React from 'react';
import TextAreaAutosize from 'react-textarea-autosize';
import ReactMarkdown from 'react-markdown';
import { Draggable } from 'react-beautiful-dnd';
import boardState from '../util/board-state';
import { TaskJSON } from '../util/kanban-type-functions';

let previousFocusedTaskId = '';
let anyTaskIsFocused = false;

/**
 * Listens for the keyboard shortcut 'Ctrl + Enter'. If a task is currently being edited,
 * then that task stops being edited. Otherwise, the previously edited task will be edited again.
 */
window.addEventListener('keypress', (event) => {
    if (!event.ctrlKey || event.key !== 'Enter') {
        return;
    }

    if (anyTaskIsFocused) {
        const taskEditor = document.getElementById(`${previousFocusedTaskId}-edit`);
        taskEditor?.blur();
    } else {
        const taskDisplay = document.getElementById(`${previousFocusedTaskId}-display`);
        taskDisplay?.click();
    }
});

/**
 * React component showing editable text that is rendered in markdown. This component can be dragged to different Columns.
 *
 * @prop data {TaskJSON} TaskJSON this Task will represent
 * @prop index {number} position of this Task in parent Column's list of Tasks
 * @prop columnId {string} ID of parent Column
 */
function Task({
    data,
    index,
    columnId,
    defaultToEdit,
    columnIndex,
}: {
    data: TaskJSON;
    index: number;
    columnId: string;
    defaultToEdit: boolean;
    columnIndex: number;
}): JSX.Element {
    const [editing, setEditing] = React.useState(defaultToEdit);
    const [text, setText] = React.useState(data.text);

    return (
        <Draggable key={data.id} draggableId={data.id} index={index}>
            {(provided, snapshot) => (
                //draggable container for the task (see react-beautiful-dnd)
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    className={['task', snapshot.isDragging ? 'drag' : ''].join(' ')}
                    onContextMenu={(event) => event.stopPropagation()}
                >
                    {/* 'Handle' user must click on to move the whole Task (react-beautiful-dnd) */}
                    <div
                        className="task-handle"
                        {...provided.dragHandleProps}
                        onMouseDown={() => setEditing(false)}
                    >
                        <a
                            className="task-delete"
                            title="Delete Task"
                            onClick={() => boardState.removeTask(columnId, data.id)}
                        >
                            <span className="codicon codicon-close" />
                        </a>
                        <span className="codicon codicon-gripper" style={{ opacity: 0.25 }} />
                    </div>

                    {/* Main content. Autosizing textbox or text rendered as markdown */}
                    <TextAreaAutosize
                        className="task-edit task-section"
                        id={`${data.id}-edit`}
                        value={text}
                        onChange={(event) => {
                            setText(event.target.value);
                        }}
                        onFocus={() => {
                            previousFocusedTaskId = data.id;
                            anyTaskIsFocused = true;
                        }}
                        onBlur={() => {
                            setEditing(false);
                            anyTaskIsFocused = false;
                            boardState.changeTaskText(columnId, columnIndex, data.id, index, text);
                        }}
                        style={{ display: editing ? 'block' : 'none' }}
                    />
                    <div
                        className="task-display task-section"
                        onClick={() => {
                            setEditing(true);
                            setTimeout(() => {
                                const textArea = document.getElementById(
                                    `${data.id}-edit`
                                ) as HTMLTextAreaElement;

                                textArea.focus();
                                textArea.selectionStart = 0;
                                textArea.selectionEnd = textArea.value.length;
                            }, 0); // Put refocusing at end of event queue so that React's DOM recreation happens first.
                        }}
                        style={{ display: editing ? 'none' : 'block' }}
                        id={`${data.id}-display`}
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
