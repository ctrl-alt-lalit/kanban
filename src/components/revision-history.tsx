import React from 'react';
import boardState, { HistoryObject, StateChanges } from '../util/board-state';

class RevisionHistory extends React.Component<{}, { history: HistoryObject[], open: boolean }> {
    constructor(props: never) {
        super(props);

        this.state = {
            history: boardState.getHistory(),
            open: false
        };

        window.addEventListener('open-history', () => this.setState({ open: true }));
    }

    componentDidMount() {
        boardState.addHistoryUpdateListener(this.historyUpdater);
    }

    componentWillUnmount() {
        boardState.removeHistoryUpdateListener(this.historyUpdater);
    }

    render(): JSX.Element {

        const style = {
            width: this.state.open ? '25%' : 0,
            display: this.state.open ? 'flex' : 'none'
        } as const;

        return (
            <div className='history' style={style}>
                <div className='history-titlebar'>
                    <a onClick={() => this.setState({ open: false })}>
                        <span className='codicon codicon-chevron-right'></span>
                    </a>
                    <h1> Revision History </h1>
                </div>
                <div className='history-scroller'>
                    {this.state.history.map((histObj, index) => (
                        <a className='history-item' onClick={() => boardState.reverseHistory(index)}>
                            <h3> {`${index + 1}.`} {this.stateChangeName(histObj.change)} </h3>
                            <p> {histObj.details} </p>
                        </a>
                    )).reverse()}
                </div>
            </div>
        );
    }

    private historyUpdater = (histObj: HistoryObject) => {
        const copy = this.state.history;
        copy.push(histObj);
        this.setState({ history: copy });
    };

    private stateChangeName(change: StateChanges) {
        switch (change) {
            case StateChanges.AUTOSAVE:
                return 'Autosave toggled';
            case StateChanges.BOARD_TITLE:
                return 'Board title changed';
            case StateChanges.COLUMN_ADDED:
                return 'Column added';
            case StateChanges.COLUMN_COLOR:
                return 'Column color changed';
            case StateChanges.COLUMN_DELETED:
                return 'Column deleted';
            case StateChanges.COLUMN_TITLE:
                return 'Column title changed';
            case StateChanges.HISTORY_REVERSED:
                return 'Undid changes';
            case StateChanges.SAVE_TO_FILE:
                return 'Save to File toggled';
            case StateChanges.TASK_ADDED:
                return 'Task added';
            case StateChanges.TASK_DELETED:
                return 'Task Deleted';
            case StateChanges.TASK_MOVED:
                return 'Task moved';
            case StateChanges.TASK_TEXT:
                return 'Task text changed';
            default:
                return 'ERROR';
        }
    }
}


export default RevisionHistory;