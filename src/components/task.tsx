import React from 'react';
import TextAreaAutosize from 'react-textarea-autosize';
import ReactMarkdown from 'react-markdown';
import { Draggable } from 'react-beautiful-dnd';
import boardState from '../util/board-state';
import { TaskJson } from '../util/kanban-types';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';

let previousFocusedTaskId = '';
let anyTaskIsFocused = false;

/**
 * Converts css color to one with reduced opacity. Does no input checking.
 *
 * @param color string of form "#RRGGBB" or "rgb(R, G, B)".
 * @param filterStrengh number between 0 and 1 (inclusive)
 * @returns color with reduced opacity
 */
function colorToFilter(color: string, filterStrengh: number) {
    if (color[0] === '#') {
        return color + (filterStrengh * 256).toString(16).padStart(2, '0');
    } else {
        return `rgba${color.slice(3, -1)}, ${filterStrengh})`;
    }
}

/**
 * Listens for the keyboard shortcut 'Ctrl + Enter'. If a task is currently being edited,
 * then that task stops being edited. Otherwise, the previously edited task will be edited again.
 */
const ctrlEnterListener = (event: KeyboardEvent) => {
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
};

/**
 * React component showing editable text that is rendered in markdown. This component can be dragged to different Columns.
 *
 * @param data {TaskJSON} TaskJSON this Task will represent
 * @param index {number} position of this Task in parent Column's list of Tasks
 * @param columnId {string} ID of parent Column
 */
export default class Task extends React.Component<
    {
        data: TaskJson;
        index: number;
        columnId: string;
        defaultToEdit: boolean;
        columnIndex: number;
        columnColor: string; // "#RRGGBB"
    },
    { editing: boolean; text: string; beingDeleted: boolean }
> {
    constructor(props: never) {
        super(props);
        this.state = {
            editing: this.props.defaultToEdit,
            text: this.props.data.text,
            beingDeleted: false,
        };
    }

    componentDidMount() {
        if (++Task.numTasks === 1) {
            window.addEventListener('keypress', ctrlEnterListener);
        }
    }

    componentWillUnmount() {
        if (--Task.numTasks === 0) {
            window.removeEventListener('keypress', ctrlEnterListener);
        }
    }

    render() {
        return (
            <Draggable key={this.id} draggableId={this.id} index={this.props.index}>
                {(provided, snapshot) => {
                    const beingDragged = snapshot.isDragging && !snapshot.isDropAnimating;

                    this.colorFilter = colorToFilter(this.props.columnColor, this.filterStrength);
                    if (snapshot.isDropAnimating) {
                        // transition to target column's color instead of home column's
                        const targetColumn = document.getElementById(snapshot.draggingOver ?? '');
                        if (targetColumn) {
                            this.colorFilter = colorToFilter(
                                targetColumn.style.color,
                                this.filterStrength
                            ); // rgb -> rgba
                        }
                    }

                    let bgColor = beingDragged ? 'rgba(0,0,0,0)' : this.colorFilter;
                    let borderColor = beingDragged
                        ? 'var(--vscode-activityBar-background)'
                        : this.colorFilter;

                    //draggable container for the task (see react-beautiful-dnd)
                    return (
                        <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={[
                                'task',
                                this.props.defaultToEdit ? 'task-added' : '',
                                this.state.beingDeleted ? 'task-deleted' : '',
                                snapshot.isDragging ? 'drag' : '',
                            ].join(' ')}
                            onContextMenu={(event) => (event.cancelable = false)} //tells column not to make menu
                            id={this.id}
                        >
                            {/* Handle user must click on to move the whole Task (react-beautiful-dnd) */}
                            <div
                                className="task-handle"
                                {...provided.dragHandleProps}
                                onMouseDown={() => this.setState({ editing: false })}
                                style={{
                                    backgroundColor: bgColor,
                                }}
                            >
                                <a
                                    className="task-delete"
                                    title="Delete Task"
                                    onClick={() => {
                                        this.setState({ beingDeleted: true });
                                        setTimeout(
                                            () =>
                                                boardState.removeTask(this.props.columnId, this.id),
                                            180
                                        );
                                    }}
                                >
                                    <span className="codicon codicon-close" />
                                </a>
                                <span className="codicon codicon-gripper" />
                            </div>

                            {/* Main content. Autosizing textbox or text rendered as markdown */}
                            <TextAreaAutosize
                                className="task-edit task-section"
                                id={`${this.id}-edit`}
                                value={this.state.text}
                                onChange={(event) => {
                                    this.setState({ text: event.target.value });
                                }}
                                onFocus={() => {
                                    previousFocusedTaskId = this.id;
                                    anyTaskIsFocused = true;
                                }}
                                onBlur={() => {
                                    this.setState({ editing: false });
                                    anyTaskIsFocused = false;
                                    boardState.setTaskText(
                                        this.props.columnId,
                                        this.props.columnIndex,
                                        this.id,
                                        this.props.index,
                                        this.state.text
                                    );
                                }}
                                style={{
                                    display: this.state.editing ? 'block' : 'none',
                                    borderColor: borderColor,
                                }}
                            />
                            <div
                                className="task-display task-section"
                                onClick={() => {
                                    this.setState({ editing: true });
                                    setTimeout(() => {
                                        const textArea = document.getElementById(
                                            `${this.id}-edit`
                                        ) as HTMLTextAreaElement;

                                        textArea.focus();
                                        textArea.selectionStart = 0;
                                        textArea.selectionEnd = textArea.value.length;
                                    }, 0); // Put refocusing at end of event queue so that React's DOM recreation happens first.
                                }}
                                style={{
                                    display: this.state.editing ? 'none' : 'block',
                                    borderColor: borderColor,
                                }}
                                id={`${this.id}-display`}
                            >
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm, remarkBreaks]}
                                    className={this.state.text ? '' : 'half-opacity'}
                                >
                                    {this.state.text || '_enter text or markdown here_'}
                                </ReactMarkdown>
                            </div>
                        </div>
                    );
                }}
            </Draggable>
        );
    }

    private filterStrength = boardState.isLightMode ? 0.75 : 0.25;
    private id = this.props.data.id;
    private colorFilter = this.props.columnColor;
    private static numTasks = 0;
}
