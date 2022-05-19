import React from 'react';
import { Droppable } from 'react-beautiful-dnd';
import Task from '../task';
import boardState from '../../util/board-state';
import { ControlledMenu, MenuItem, useMenuState } from '@szhsin/react-menu';
import { ColumnJson } from '../../util/kanban-types';
import ColorPicker from './color-picker';

let IdOfTaskJustAdded = '';

/**
 * React component showing a vertical list of Tasks. Tasks from other Columns can be dropped into this list and vice-versa.
 *
 * @prop data {StrictColumnJSON} StrictColumnJSON this Component Represents
 * @prop numCols {number} number of Columns in the parent Board
 * @prop index {nummber} index of this column in the parent Board's column list
 *
 * A StrictColumnJSON passed in will update the data prop of this Column to the parameter. If this Columns' id (a string)
 * is given, then this Column will be deleted.
 */
export default function Column({
    data,
    numCols,
    index,
}: {
    data: ColumnJson;
    numCols: number;
    index: number;
}) {
    // open and close context menu
    const { toggleMenu, ...menuProps } = useMenuState();
    const [menuAnchorPoint, setMenuAnchorPoint] = React.useState({
        x: 0,
        y: 0,
    });
    const [title, setTitle] = React.useState(data.title);

    // hooks to open and close settings and color picker
    const [colorPickerOpen, setColorPickerOpen] = React.useState(false);
    const [settingsOpen, setSettingsOpen] = React.useState(false);

    const settingsStyle = {
        // CSS styles so that settings menu "swipes" open and closed
        maxHeight: settingsOpen ? '3rem' : 0,
        pointerEvents: settingsOpen ? 'all' : 'none',
        transition: 'max-height 0.4s linear',
        paddingTop: '0.4rem',
    } as const;

    /* Color Picker code */

    /* End Color Picker */

    const anchorProps = {
        // CSS styles so that buttons match Column's color
        style: { color: data.color },
        onMouseEnter: (event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) =>
            (event.currentTarget.style.backgroundColor = data.color),
        onMouseLeave: (event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) =>
            (event.currentTarget.style.backgroundColor = 'inherit'),
    } as const;

    return (
        <div
            className="column"
            style={{
                color: data.color,
                borderColor: data.color,
                width: `${100 / numCols}%`,
            }}
            onContextMenu={(event) => {
                if (event.cancelable) {
                    //menu on task will set cancellable false
                    event.preventDefault();
                    setMenuAnchorPoint({ x: event.clientX, y: event.clientY });
                    toggleMenu(true);
                    event.stopPropagation();
                }
            }}
            id={data.id}
        >
            {/* Customize context menu */}
            <ControlledMenu
                {...menuProps}
                anchorPoint={menuAnchorPoint}
                onClose={() => toggleMenu(false)}
                menuStyles={{
                    color: 'var(--vscode-editor-foreground)',
                    backgroundColor: 'var(--vscode-editor-background)',
                }}
            >
                <MenuItem className="context-menu-item" onClick={() => boardState.addTask(data.id)}>
                    <span className="codicon codicon-add" /> &nbsp; Add Task
                </MenuItem>
                <MenuItem
                    className="context-menu-red"
                    onClick={() => boardState.removeColumn(data.id)}
                >
                    <span className="codicon codicon-trash" /> &nbsp; Delete Column
                </MenuItem>
            </ControlledMenu>

            {/* Contains the column's title this column's buttons (add task, delete column, show/hide color picker) */}
            <div className="column-titlebar">
                <input
                    value={title}
                    maxLength={12}
                    className="column-title"
                    style={{ color: data.color, outlineColor: data.color }}
                    onChange={(event) => setTitle(event.target.value)}
                    onBlur={() => boardState.setColumnTitle(data.id, title)}
                />
                <a
                    className="column-settings-toggle"
                    {...anchorProps}
                    onClick={() => {
                        setColorPickerOpen(false);
                        setSettingsOpen(!settingsOpen);
                    }}
                >
                    <span className="codicon codicon-gear" />
                </a>
            </div>

            {/* Settings */}
            <div className="column-settings" style={settingsStyle}>
                <a
                    className="column-color"
                    title="Change Color"
                    {...anchorProps}
                    onClick={() => setColorPickerOpen(!colorPickerOpen)}
                >
                    <span className="codicon codicon-symbol-color" />
                </a>

                <a
                    className="column-left"
                    title="Move Column Left"
                    {...anchorProps}
                    style={{
                        display: index > 0 ? 'block' : 'none',
                        color: data.color,
                    }}
                    onClick={() => boardState.moveColumn(data.id, index - 1)}
                >
                    <span className="codicon codicon-arrow-left" />
                </a>
                <a
                    className="column-right"
                    title="Move Column Right"
                    {...anchorProps}
                    style={{
                        display: index < numCols - 1 ? 'block' : 'none',
                        color: data.color,
                    }}
                    onClick={() => boardState.moveColumn(data.id, index + 1)}
                >
                    <span className="codicon codicon-arrow-right" />
                </a>

                <a
                    className="column-delete"
                    title="Delete Column"
                    {...anchorProps}
                    onClick={() => boardState.removeColumn(data.id)}
                >
                    <span className="codicon codicon-trash" />
                </a>
            </div>

            {/* Color Picker */}
            <ColorPicker
                isOpen={colorPickerOpen}
                color={data.color}
                changeColor={(newColor) => boardState.setColumnColor(data.id, newColor)}
            />

            {/* Add Task Button */}
            <a
                className="column-add-task"
                title="Add Task"
                style={{ color: data.color, borderColor: data.color }}
                onClick={() => {
                    const taskId = boardState.addTask(data.id);
                    IdOfTaskJustAdded = taskId;
                    setTimeout(() => {
                        const taskElem = document.getElementById(`${taskId}-edit`);
                        taskElem?.focus();
                        IdOfTaskJustAdded = '';
                    }, 0);
                }}
            >
                <span className="codicon codicon-add" />
            </a>

            {/* Main content. The Task list. Droppables are where Draggables can be moved to (react-beautiful-dnd) */}
            <Droppable droppableId={data.id} key={data.id}>
                {(provided, snapshot) => (
                    <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`column-tasks ${snapshot.isDraggingOver ? 'drag-over' : ''}`}
                    >
                        {data.tasks.map((task, taskIndex) => (
                            <Task
                                data={task}
                                index={taskIndex}
                                key={task.id}
                                columnId={data.id}
                                columnIndex={index}
                                defaultToEdit={IdOfTaskJustAdded === task.id}
                                columnColor={data.color}
                            />
                        ))}
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>
        </div>
    );
}
