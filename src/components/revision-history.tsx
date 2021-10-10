import React from 'react';
import boardState, { HistoryObject, StateChanges } from '../util/board-state';

class RevisionHistory extends React.Component<{}, { history: HistoryObject[], open: boolean }> {
    constructor(props: never) {
        super(props);

        this.state = {
            history: boardState.getHistory(),
            open: false
        };

        window.addEventListener('open-history', this.openListener);
    }

    componentDidMount() {
        boardState.addHistoryUpdateListener(this.historyUpdater);
    }

    componentWillUnmount() {
        window.removeEventListener('open-history', this.openListener);
        boardState.removeHistoryUpdateListener(this.historyUpdater);
    }

    render(): JSX.Element {

        const style = {
            maxWidth: this.state.open ? '25%' : 0,
            transition: 'max-width 0.3s ease 0s',
            pointerEvents: this.state.open ? 'all' : 'none'
        } as const;

        return (
            <div className='history' style={style}>
                <div className='history-titlebar'>
                    <a onClick={() => this.setState({ open: false })} title='Hide Revision History'>
                        <span className='codicon codicon-chevron-right'></span>
                    </a>
                    <h1> Revision History </h1>
                </div>
                <div className='history-scroller'>
                    {this.state.history.map((histObj, index) => (
                        <a className='history-item' onClick={() => boardState.reverseHistory(index)} key={index}>
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
            case StateChanges.BOARD_TITLE:
                return 'Board title changed';
            case StateChanges.COLUMN_COLOR:
                return 'Column color changed';
            case StateChanges.COLUMN_DELETED:
                return 'Column deleted';
            case StateChanges.COLUMN_TITLE:
                return 'Column title changed';
            case StateChanges.HISTORY_REVERSED:
                return 'Undid changes';
            case StateChanges.TASK_DELETED:
                return 'Task Deleted';
            case StateChanges.TASK_TEXT:
                return 'Task text changed';
            case StateChanges.BOARD_LOADED:
                return 'Board loaded';
            default:
                return 'ERROR';
        }
    }

    private openListener = () => this.setState({ open: true });
}


export default RevisionHistory;