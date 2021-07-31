import React from 'react';
import Showdown from 'showdown';
import ReactMarkdown from 'react-markdown';



function Task({text}: {text: string}): JSX.Element {

    const [taskText, setTaskText] = React.useState(text);
    const [editing, setEditing] = React.useState(false);

    const style = {
        backgroundColor: 'blue',
        margin: 5
    } as const;

    return (
        <div className='task' style={style}>
            <textarea
                value={taskText}
                onChange={(event) => setTaskText(event.target.value)}
                onBlur={() => setEditing(false)}
                style={{display: editing ? 'block' : 'none'}}
            />
            <div onClick={() => setEditing(true)} style={{display: editing ? 'none' : 'block'}}>
                    <ReactMarkdown>
                        {taskText || 'Enter markdown here'}
                    </ReactMarkdown>
                </div>
        </div>
    );
}

//TODO: get save button to retrieve data from all items
export default Task;