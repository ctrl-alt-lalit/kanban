import React from 'react';
import {Droppable} from 'react-beautiful-dnd';
import toast from 'react-hot-toast';
import Task from './task';
import {HexColorInput} from 'react-colorful';
import { createTaskJson } from '../util/kanban-type-functions';

/**
 * React component showing a vertical list of Tasks. Tasks from other Columns can be dropped into this list and vice-versa.
 * 
 * @prop data - StrictColumnJSON this Component Represents
 * @prop numCols - number of Columns in the parent Board
 * @prop callback - (StrictColumnJSON | string) => void -- notifies parent Board whenever Column state is updated.
 * A StrictColumnJSON passed in will update the data prop of this Column to the parameter. If this Columns' id (a string)
 * is given, then this Column will be deleted
 */
function Column({data,callback, numCols}: {data: StrictColumnJSON, callback: (data: StrictColumnJSON | string) => void, numCols: number}) {

    const [colorSwitcherActive, setColorSwitcherActive] = React.useState(false);

    /**
     * Updates this Column's data prop to reflect a change in a child Task's state.
     * Note: Should be passed in as a Task prop, not called directly.
     * 
     * @param {string | null} text string to replace a Task's text, or null to delete the task
     * @param {number} index position of the Task in this Column's list 
     */
    function taskCallback(text: string | null, index: number) {
        if (text !== null) {
            data.tasks[index].text = text;
        } else {
            const oldData = {...data};
            oldData.tasks = [...data.tasks];
            toast(t => (
                <div style={{
                    display: 'inline-flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                }}>
                    <p>Task Deleted &emsp;</p>
                    <a  style={{cursor: 'pointer'}} onClick={() => {
                        callback(oldData);
                        toast.dismiss(t.id);
                    }}>
                        Undo 
                    </a>
                </div>
            ));

            data.tasks.splice(index, 1);
        }
        
        callback(data);  
    }


    /**
     * React component used to change the color of this Column.
     */
    function ColorChanger(): JSX.Element {
        function changeColor(color: string) {
            if (color.length < 6) {
                return;
            }
            data.color = color;
            callback(data);
        }

        const darkSwatches = [
            '#dd302a', '#cf4d19', '#ec9c25', '#7ac41a', '#416a0b',
            '#338c84', '#344fa2', '#d741e3', '#9900ef', '#6a6a6a'
        ];
        const lightSwatches = [
            '#ff6900', '#fcb900', '#7bdcb5', '#00d084', '#8ed1fc',
            '#0693e3', '#abb8c3', '#eb144c', '#f78da7', '#9900ef'
        ];
        const swatches = document.querySelector('body.vscode-dark') ? lightSwatches : darkSwatches;

        return (
            <div className={['column-color-picker', colorSwitcherActive ? 'visible' : ''].join(' ')}>
                {swatches.map(swatch => (
                    <button
                        key={swatch}
                        className='column-color-picker__swatch'
                        style={{backgroundColor: swatch}}
                        onClick={() => changeColor(swatch)}
                    />
                ))}
                <div className='text-picker'>
                    <div className='input-tag'> # </div>
                    <HexColorInput color={data.color} onChange={changeColor}/>
                </div>
            </div>
        );
    }

    const anchorProps = {
        'style': {color: data.color},
        'onMouseEnter': (event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => event.currentTarget.style.backgroundColor = data.color,
        'onMouseLeave': (event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => event.currentTarget.style.backgroundColor = 'inherit',
    } as const;

    return (
        <div
            className='column'
            style={{color: data.color, borderColor: data.color, width: `${100/numCols}%`}}
            onBlur={() => setColorSwitcherActive(false)}
        >
            {/* Contains the column's title this column's buttons (add task, delete column, show/hide color picker) */}
            <div className='column-titlebar'>
                <input value={data.title} maxLength={12} className='column-title' style={{color: data.color, outlineColor: data.color}} onChange={event => {
                    data.title = event.target.value;
                    callback(data);
                }}/>
                <a className='column-add-task' title='Add Task' {...anchorProps} onClick={() => {
                    data.tasks.push(createTaskJson());
                    callback(data);
                }}>
                    <span className='codicon codicon-empty-window'/>
                </a>
                <a className='column-color' title='Change Color' {...anchorProps} onClick={() => setColorSwitcherActive(!colorSwitcherActive)}>
                    <span className='codicon codicon-symbol-color'/>
                </a>
                <a className='column-delete' title='Delete Column' {...anchorProps} onClick={() => callback(data.id)}>
                    <span className='codicon codicon-trash'/>
                </a>
            </div>
            <ColorChanger/>

            {/* Main content. The Task list. Droppables are where Draggables can be moved to (react-beautiful-dnd) */}
            <Droppable droppableId={data.id} key={data.id}>
                {(provided, snapshot) => (
                    <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className= {['column-tasks', snapshot.isDraggingOver ? 'drag-over' : ''].join(' ')}
                    >
                        {data.tasks.map((task, index) => (
                            <Task
                                data={task}
                                index={index} 
                                callback={(str: string | null) => taskCallback(str, index)}
                                key={task.id}
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