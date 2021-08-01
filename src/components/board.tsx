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

    const columnRefs= new Map<string, React.RefObject<Column>>();

    function serialize() {
        const columns = savedData!.cols.map(col => columnRefs.get(col.title)!.current!.serialize());

        return {
            ncols: columns.length,
            cols: columns?.map(col => { return {title: col?.title, ntasks: col?.tasks.length, tasks: col?.tasks}; }),
            settings: savedData?.settings
        };
    }

    return (
        <div style={style} className='board'>
            {savedData?.cols.map(col => {
                const ref = React.createRef() as React.RefObject<Column>;
                columnRefs.set(col.title, ref);
                return <Column initialTitle={col.title} initialTasks={col.tasks} ref={ref}/>;
            })}
            <button onClick={() => messageHandler.send('save', serialize())}> Save </button>
        </div>
    );
}

export default Board;
