/**
 * @file React component showing a vertical list of Tasks. Tasks from other Columns can be dropped into this list and vice-versa.
 */
import React from 'react';
import { Droppable } from 'react-beautiful-dnd';
import Task, { ContextMenuEvent } from '../task';
import boardState from '../../util/board-state';
import { ControlledMenu, MenuItem, useMenuState } from '@szhsin/react-menu';
import { ColumnJson, TaskJson } from '../../util/kanban-types';
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
    const [menuProps, toggleMenu] = useMenuState();
    const [menuAnchorPoint, setMenuAnchorPoint] = React.useState({
        x: 0,
        y: 0,
    });

    const [title, setTitle] = React.useState(data.title);
    const [colorPickerOpen, setColorPickerOpen] = React.useState(false);
    const [settingsOpen, setSettingsOpen] = React.useState(false);

    type AnchorMouseEvent = React.MouseEvent<HTMLAnchorElement, MouseEvent>;
    const anchorProps = {
        // CSS styles so that buttons match Column's color
        style: { color: data.color },
        onMouseEnter: (event: AnchorMouseEvent) =>
            (event.currentTarget.style.backgroundColor = data.color),
        onMouseLeave: React.useCallback(
            (event: AnchorMouseEvent) => (event.currentTarget.style.backgroundColor = 'inherit'),
            []
        ),
    } as const;

    const toggleColorFn = React.useCallback(
        () => setColorPickerOpen(!colorPickerOpen),
        [setColorPickerOpen, colorPickerOpen]
    );

    const columnSettings = React.useMemo(
        () => (
            <ColumnSettings
                columnId={data.id}
                color={data.color}
                toggleColorPicker={toggleColorFn}
                anchorProps={anchorProps}
                isOpen={settingsOpen}
                columnIndex={index}
                numCols={numCols}
            />
        ),
        [data.id, data.color, toggleColorFn, anchorProps, settingsOpen, index, numCols]
    );

    const changeColorFn = React.useCallback(
        (color: string) => {
            if (color !== data.color) {
                boardState.setColumnColor(data.id, color);
            }
        },
        [data.id, data.color]
    );

    const colorPicker = React.useMemo(
        () => (
            <ColorPicker isOpen={colorPickerOpen} color={data.color} changeColor={changeColorFn} />
        ),
        [colorPickerOpen, data.color, changeColorFn]
    );

    const AddTaskFn = React.useCallback(() => {
        const taskId = boardState.addTask(data.id);
        IdOfTaskJustAdded = taskId;
        setTimeout(() => {
            const taskElem = document.getElementById(`${taskId}-edit`);
            taskElem?.focus();
            IdOfTaskJustAdded = '';
        }, 0);
    }, [data.id]);

    const makeTask = React.useCallback(
        (task: TaskJson, taskIndex: number) => (
            <Task
                data={task}
                index={taskIndex}
                key={task.id}
                columnId={data.id}
                columnIndex={index}
                defaultToEdit={IdOfTaskJustAdded === task.id}
                columnColor={data.color}
            />
        ),
        [data.id, data.color, index, IdOfTaskJustAdded]
    );

    return (
        <div
            className="column"
            style={{
                color: data.color,
                borderColor: data.color,
                width: `${100 / numCols}%`,
            }}
            onContextMenu={(event) => {
                let cmEvent = event as unknown as ContextMenuEvent;
                if (cmEvent.preventCustomMenu) {
                    // menu was activated on task. Use system default.
                    return;
                }

                event.preventDefault();
                setMenuAnchorPoint({ x: event.clientX, y: event.clientY });
                toggleMenu(true);
                event.stopPropagation();
            }}
            id={data.id}
        >
            {/* Customized context menu */}
            <ControlledMenu
                {...menuProps}
                anchorPoint={menuAnchorPoint}
                onClose={() => toggleMenu(false)}
                menuStyle={{
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

            {columnSettings}
            {colorPicker}

            {/* Add Task Button */}
            <a
                className="column-add-task"
                title="Add Task"
                style={{ color: data.color, borderColor: data.color }}
                onClick={AddTaskFn}
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
                        {data.tasks.map(makeTask)}
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>
        </div>
    );
}
