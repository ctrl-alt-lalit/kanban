import React from 'react';
import TextAreaAutosize from 'react-textarea-autosize';
import ReactMarkdown from 'react-markdown';



class Task extends React.Component<{initialText: string},{text: string, editing: boolean}> {

    constructor(props: never) {
        super(props);
        this.state = {
            text: this.props.initialText,
            editing: false
        };
    }

    serialize(): string {
        return this.state.text;
    }

    render(): JSX.Element {
        return (
            <div className='task' style={this.style}>
                <TextAreaAutosize
                    value={this.state.text}
                    onChange={(event) => this.setState({text: event.target.value})}
                    onBlur={() => this.setState({editing: false})}
                    style={{display: this.state.editing ? 'block' : 'none'}}
                />
                <div
                    onClick={() => this.setState({editing: true})}
                    style={{display: this.state.editing ? 'none' : 'block'}}
                >
                    <ReactMarkdown>
                        {this.state.text || 'Enter markdown here'}
                    </ReactMarkdown>
                </div>
            </div>
        );
    }

    private style = {
        backgroundColor: 'blue',
        margin: 5
    } as const;
    
}

//TODO: get save button to retrieve data from all items
export default Task;