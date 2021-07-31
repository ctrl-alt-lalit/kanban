import React from 'react';
import Task from './task';


function Column({title, tasks}: {title: string, tasks: string[]}): JSX.Element {
    const style = {
        flexBasis: 0,
        flexGrow: 1,
        flexDirection: 'column',
        backgroundColor: 'red',
        margin: 5,
        height: '100%'
    } as const;

    return (
        <div style={style}>
            <h3> {title} </h3>
            {tasks.map(text => <Task text={text}/>)}
        </div>
    );
}

export default Column;