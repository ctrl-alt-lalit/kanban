import React from 'react';
import { Droppable } from 'react-beautiful-dnd';
import Task from './task';
import { HexColorInput } from 'react-colorful';
import boardState from '../util/board-state';
import { ControlledMenu, MenuItem, useMenuState } from '@szhsin/react-menu';

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
function Column({
    data,
    numCols,
    index,
}: {
    data: StrictColumnJSON;
    numCols: number;
    index: number;
}) {
    // open and close context menu
    const { toggleMenu, ...menuProps } = useMenuState();
    const [menuAnchorPoint, setMenuAnchorPoint] = React.useState({
        x: 0,
        y: 0,
    });

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

    /**
     * Changes this Column's color
     *
     * @param color {string} new color the column should have
     */
    const changeColor = (color: string) => {
        if (color.length < 6) {
            return;
        }
        boardState.changeColumnColor(data.id, color);
    };

    const colorPickerStyle = {
        // CSS styles so that color picker "swipes" open and closed
        maxHeight: colorPickerOpen ? '6rem' : 0,
        pointerEvents: colorPickerOpen ? 'all' : 'none',
        transition: 'max-height 0.4s linear',
    } as const;

    const darkSwatches = [
        // colors to pick from in dark mode
        '#dd302a',
        '#cf4d19',
        '#ec9c25',
        '#7ac41a',
        '#416a0b',
        '#338c84',
        '#344fa2',
        '#d741e3',
        '#9900ef',
        '#6a6a6a',
    ];
    const lightSwatches = [
        // colors to pick from in light mode
        '#ff6900',
        '#fcb900',
        '#7bdcb5',
        '#00d084',
        '#8ed1fc',
        '#0693e3',
        '#abb8c3',
        '#eb144c',
        '#f78da7',
        '#9900ef',
    ];
    const swatches = document.querySelector('body.vscode-dark')
        ? lightSwatches
        : darkSwatches;
    /* End Color Picker */

    const anchorProps = {
        // CSS styles so that buttons match Column's color
        style: { color: data.color },
        onMouseEnter: (
            event: React.MouseEvent<HTMLAnchorElement, MouseEvent>
        ) => (event.currentTarget.style.backgroundColor = data.color),
        onMouseLeave: (
            event: React.MouseEvent<HTMLAnchorElement, MouseEvent>
        ) => (event.currentTarget.style.backgroundColor = 'inherit'),
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
                event.preventDefault();
                setMenuAnchorPoint({ x: event.clientX, y: event.clientY });
                toggleMenu(true);
                event.stopPropagation();
            }}
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
                <MenuItem
                    className="context-menu-item"
                    onClick={() => boardState.addTask(data.id)}
                >
                    <span className="codicon codicon-add" /> &nbsp; Add Task
                </MenuItem>
                <MenuItem
                    className="context-menu-red"
                    onClick={() => boardState.removeColumn(data.id)}
                >
                    <span className="codicon codicon-trash" /> &nbsp; Delete
                    Column
                </MenuItem>
            </ControlledMenu>

            {/* Contains the column's title this column's buttons (add task, delete column, show/hide color picker) */}
            <div className="column-titlebar">
                <input
                    value={data.title}
                    maxLength={12}
                    className="column-title"
                    style={{ color: data.color, outlineColor: data.color }}
                    onChange={(event) => {
                        const title = event.target.value;
                        boardState.changeColumnTitle(data.id, title);
                    }}
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
            <div className="column-color-picker" style={colorPickerStyle}>
                {swatches.map((swatch) => (
                    <button
                        key={swatch}
                        className="column-color-picker__swatch"
                        style={{ backgroundColor: swatch }}
                        onClick={() => changeColor(swatch)}
                    />
                ))}
                <div className="text-picker">
                    <div className="input-tag"> # </div>
                    <HexColorInput color={data.color} onChange={changeColor} />
                </div>
            </div>

            {/* Add Task Button */}
            <a
                className="column-add-task"
                title="Add Task"
                style={{ color: data.color, borderColor: data.color }}
                onClick={() => {
                    const taskId = boardState.addTask(data.id);
                    IdOfTaskJustAdded = taskId;
                    setTimeout(() => {
                        const taskElem = document.getElementById(
                            `${taskId}-edit`
                        );
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
                        className={[
                            'column-tasks',
                            snapshot.isDraggingOver ? 'drag-over' : '',
                        ].join(' ')}
                    >
                        {data.tasks.map((task, taskIndex) => (
                            <Task
                                data={task}
                                index={taskIndex}
                                key={task.id}
                                columnId={data.id}
                                defaultToEdit={IdOfTaskJustAdded === task.id}
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
