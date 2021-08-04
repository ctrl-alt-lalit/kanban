import React from 'react';
import {Droppable} from 'react-beautiful-dnd';
import toast from 'react-hot-toast';
import Task from './task';
import {HexColorInput} from 'react-colorful';

function Column({data,callback, numCols}: {data: StrictColumnJSON, callback: (data: StrictColumnJSON | string) => void, numCols: number}) {

    const [colorSwitcherActive, setColorSwitcherActive] = React.useState(false);

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


    function ColorChanger(): JSX.Element {
        function changeColor(color: string) {
            if (color.length < 6) {
                return;
            }
            data.color = color;
            callback(data);
        }

        const swatches = [
            '#ff6900', '#fcb900', '#7bdcb5', '#00d084', '#8ed1fc',
            '#0693e3', '#abb8c3', '#eb144c', '#f78da7', '#9900ef'
        ];

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
            <div className='column-titlebar'>
                <input value={data.title} maxLength={12} className='column-title' style={{color: data.color}} onChange={event => {
                    data.title = event.target.value;
                    callback(data);
                }}/>
                <a className='column-add-task' title='Add Task' {...anchorProps} onClick={() => {
                    data.tasks.push({text: '', id: Math.random().toString(36)});
                    callback(data);
                }}>
                    <span className='codicon codicon-empty-window'/>
                </a>
                <a className='column-color' title='Change Color' {...anchorProps} onClick={() => setColorSwitcherActive(!colorSwitcherActive)}>
                    <span className='codicon codicon-symbol-color'/>
                </a>
                <a className='column-delete' title='Delete Column' {...anchorProps} onClick={() => callback(data.id)}>
                    <span className='codicon codicon-remove'/>
                </a>
            </div>
            <ColorChanger/>
            <Droppable droppableId={data.id} key={data.id}>
                {(provided, snapshot) => (
                    <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className= {['column-tasks', snapshot.isDraggingOver ? 'drag-over' : ''].join(' ')}
                    >
                        {data.tasks.map((task, index) => (
                            <Task data={task} index={index} callback={(str: string | null) => taskCallback(str, index)}/>
                        ))}
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>
        </div>
    );
}

export default Column;