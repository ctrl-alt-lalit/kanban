/**
 * @file React component showing a vertical list of Tasks. Tasks from other Columns can be dropped into this list and vice-versa.
 */
import React from 'react';
import { Droppable } from 'react-beautiful-dnd';
import Task from '../task';
import boardState from '../../util/board-state';
import { ControlledMenu, MenuItem, useMenuState } from '@szhsin/react-menu';
import { ColumnJson } from '../../util/kanban-types';
import ColorPicker from './color-picker';
import ColumnSettings from './column-settings';

let IdOfTaskJustAdded = '';

/**
 * React component showing a vertical list of Tasks. Tasks from other Columns can be dropped into this list and vice-versa.
 *
 * @param data {StrictColumnJSON} StrictColumnJSON this Component Represents
 * @param numCols {number} number of Columns in the parent Board
 * @param index {nummber} index of this column in the parent Board's column list
 *
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
    const [colorPickerOpen, setColorPickerOpen] = React.useState(false);
    const [settingsOpen, setSettingsOpen] = React.useState(false);

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
                    event.preventDefault();
                    setMenuAnchorPoint({ x: event.clientX, y: event.clientY });
                    toggleMenu(true);
                    event.stopPropagation();
                }
                // else: menu was activated on task
            }}
            id={data.id}
        >
            {/* Customized context menu */}
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

            {/* Column Titlebar */}
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

            <ColumnSettings
                columnId={data.id}
                color={data.color}
                toggleColorPicker={() => setColorPickerOpen(!colorPickerOpen)}
                anchorProps={anchorProps}
                isOpen={settingsOpen}
                columnIndex={index}
                numCols={numCols}
            />

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
