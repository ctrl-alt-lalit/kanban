import React from 'react';
import Task from './task';


class Column extends React.Component<{initialTitle: string, initialTasks: string[]},{title: string, tasks: string[]}> {

    constructor(props: never) {
        super(props);
        this.state = {
            title: this.props.initialTitle,
            tasks: this.props.initialTasks
        };
    }

    serialize() {
        return {
            title: this.state.title,
            tasks: this.state.tasks.map(task => this.taskRefs.get(task)!.current!.serialize())
        };
    }

    render(): JSX.Element {
        return (
            <div style={this.style}>
                <div className='col-toolbar'>
                    {this.state.title}
                    <button onClick={() => this.setState({tasks: this.state.tasks.concat('')})}>
                        Add task
                    </button>
                </div>
                {this.state.tasks.map(text => {
                    const ref = React.createRef() as React.RefObject<Task>;
                    this.taskRefs.set(text, ref);
                    return <Task initialText={text} ref={ref}/>;
                })}
                <p>
                    {() => this.serialize()}
                </p>
            </div>
        );
    }

    private style = {
        flexBasis: 0,
        flexGrow: 1,
        flexDirection: 'column',
        backgroundColor: 'red',
        margin: 5,
        height: '100%'
    } as const;

    private taskRefs = new Map<string, React.RefObject<Task>>();
}

export default Column;