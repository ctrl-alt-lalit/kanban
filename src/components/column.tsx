import React from 'react';
import { Droppable } from 'react-beautiful-dnd';
import Task from './task';

type ColumnTask = {text: string, id: string};

class Column extends React.Component<{initialState: StrictColumnJSON, id: string},{title: string, tasks: ColumnTask[]}> {

    constructor(props: never) {
        super(props);

        let tasks: ColumnTask[] = [];
        for (let i = 0; i < this.props.initialState.tasks.length; ++i) {
            const task = {
                text: this.props.initialState.tasks[i],
                id: this.props.initialState.taskIds[i]
            };
            tasks.push(task);
        }

        this.state = {
            title: this.props.initialState.title,
            tasks: tasks
        };
    }

    serialize(): StrictColumnJSON {
        return {
            title: this.state.title,
            tasks: this.state.tasks.map(task => task.text),
            taskIds: this.state.tasks.map(task => task.id),
        };
    }

    render(): JSX.Element {
        return (
            <div style={this.style} className='column'>
                <div className='col-toolbar'>
                    {this.state.title}
                    <button onClick={() => {
                        this.setState({
                            tasks: this.state.tasks.concat({
                                text: '',
                                id: Math.random().toString(36)
                        })});
                    }}>
                        Add task
                    </button>
                </div>
                <Droppable droppableId={this.props.id} key={this.props.id}>
                    {(provided, snapshot) => (
                        <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className= {['column-tasks', snapshot.isDraggingOver ? 'drag-over' : ''].join(' ')}
                            style={{backgroundColor: 'yellow'}}
                        >
                            {this.state.tasks.map((task, index) => (
                                <Task
                                    text={task.text}
                                    index={index}
                                    id={task.id}
                                    callback={(text: string) => this.taskCallback(text, index)}
                                />
                            ))}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            </div>
        );
    }

    updateTasks(tasks: string[], taskIds: string[]) {
        if (tasks.length !== taskIds.length) {
            console.error('Column.updateTasks(): Mismatched input lengths');
            return;
        }

        let newTasks: ColumnTask[] = [];
        for (let i = 0; i < tasks.length; ++i) {
            newTasks.push({text: tasks[i], id: taskIds[i]});
        }
        this.setState({tasks: newTasks});
    }

    private taskCallback(text: string, index: number) {
        let taskCopies = [...this.state.tasks];
        taskCopies[index].text = text;
        this.setState({tasks: taskCopies});
    }

    private style = {
        backgroundColor: 'red',
    } as const;
}

export default Column;