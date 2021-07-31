import React, { useState } from 'react';
import messageHandler from '../util/message-handler';
import Column from './column';

function Board(): JSX.Element {

    const [savedData, updateSavedData] = useState(messageHandler.previouslySavedData);
    
    if (!savedData) {
        const callback = (command: string, data: any) => {
            if (command === 'load') {
                const defaultData = {
                    ncols: 4,
                    cols: [
                        {title: 'Bugs', ntasks: 0, tasks: []},
                        {title: 'To-Do', ntasks: 1, tasks: ['']},
                        {title: 'Doing', ntasks: 0, tasks: []},
                        {title: 'Done', ntasks: 0, tasks: []}
                    ],
                    settings: {autosave: false}
                };

                updateSavedData(data ?? defaultData);
            }
        };
        messageHandler.addListener(callback);
    }

    const style = {
        backgroundColor: 'green'
    } as const;

    return (
        <div style={style} className='board'>
            {savedData?.cols.map(col => <Column title={col.title} tasks={col.tasks}/>)}
            <button onClick={() => messageHandler.send('save', savedData)}> Save </button>
        </div>
    );
}

export default Board;
