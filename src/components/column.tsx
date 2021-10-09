import React from 'react';
import { Droppable } from 'react-beautiful-dnd';
import Task from './task';
import { HexColorInput } from 'react-colorful';
import boardState from '../util/board-state';

/**
 * React component showing a vertical list of Tasks. Tasks from other Columns can be dropped into this list and vice-versa.
 * 
 * @prop data - StrictColumnJSON this Component Represents
 * @prop numCols - number of Columns in the parent Board
 * @prop callback - (StrictColumnJSON | string) => void -- notifies parent Board whenever Column state is updated.
 * A StrictColumnJSON passed in will update the data prop of this Column to the parameter. If this Columns' id (a string)
 * is given, then this Column will be deleted
 */
function Column({ data, numCols }: { data: StrictColumnJSON, numCols: number }) {

    const [colorPickerOpen, setColorPickerOpen] = React.useState(false);

    const changeColor = (color: string) => {
        if (color.length < 6) {
            return;
        }
        boardState.changeColumnColor(data.id, color);
    };

    const colorPickerStyle = {
        maxHeight: colorPickerOpen ? '6rem' : 0,
        pointerEvents: colorPickerOpen ? 'all' : 'none',
        transition: 'max-height 0.4s linear'
    } as const;

    const darkSwatches = [
        '#dd302a', '#cf4d19', '#ec9c25', '#7ac41a', '#416a0b',
        '#338c84', '#344fa2', '#d741e3', '#9900ef', '#6a6a6a'
    ];
    const lightSwatches = [
        '#ff6900', '#fcb900', '#7bdcb5', '#00d084', '#8ed1fc',
        '#0693e3', '#abb8c3', '#eb144c', '#f78da7', '#9900ef'
    ];
    const swatches = document.querySelector('body.vscode-dark') ? lightSwatches : darkSwatches;


    const anchorProps = {
        'style': { color: data.color },
        'onMouseEnter': (event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => event.currentTarget.style.backgroundColor = data.color,
        'onMouseLeave': (event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => event.currentTarget.style.backgroundColor = 'inherit',
    } as const;

    return (
        <div
            className='column'
            style={{ color: data.color, borderColor: data.color, width: `${100 / numCols}%` }}
        >
            {/* Contains the column's title this column's buttons (add task, delete column, show/hide color picker) */}
            <div className='column-titlebar'>
                <input value={data.title} maxLength={12} className='column-title' style={{ color: data.color, outlineColor: data.color }} onChange={event => {
                    const title = event.target.value;
                    boardState.changeColumnTitle(data.id, title);
                }} />
                <a className='column-add-task' title='Add Task' {...anchorProps} onClick={() => boardState.addTask(data.id)}>
                    <span className='codicon codicon-empty-window' />
                </a>
                <a className='column-color' title='Change Color' {...anchorProps} onClick={() => setColorPickerOpen(!colorPickerOpen)}>
                    <span className='codicon codicon-symbol-color' />
                </a>
                <a className='column-delete' title='Delete Column' {...anchorProps} onClick={() => boardState.removeColumn(data.id)}>
                    <span className='codicon codicon-trash' />
                </a>
            </div>

            {/* Color Picker */}
            <div className='column-color-picker' style={colorPickerStyle}>
                {swatches.map(swatch => (
                    <button
                        key={swatch}
                        className='column-color-picker__swatch'
                        style={{ backgroundColor: swatch }}
                        onClick={() => changeColor(swatch)}
                    />
                ))}
                <div className='text-picker'>
                    <div className='input-tag'> # </div>
                    <HexColorInput color={data.color} onChange={changeColor} />
                </div>
            </div>

            {/* Main content. The Task list. Droppables are where Draggables can be moved to (react-beautiful-dnd) */}
            <Droppable droppableId={data.id} key={data.id}>
                {(provided, snapshot) => (
                    <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={['column-tasks', snapshot.isDraggingOver ? 'drag-over' : ''].join(' ')}
                    >
                        {data.tasks.map((task, index) => (
                            <Task
                                data={task}
                                index={index}
                                key={task.id}
                                columnId={data.id}
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