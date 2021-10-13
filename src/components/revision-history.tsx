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
            pointerEvents: this.state.open ? 'all' : 'none',
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
                    {this.state.history.map((histObj, index) => {

                        const prevHist = (index > 0) ? this.state.history[index - 1] : null;
                        const prevChange = prevHist ? prevHist.change : StateChanges.BOARD_LOADED;
                        const prevDetail = prevHist ? prevHist.details : '';

                        return (
                            <a
                                className='history-item'
                                onClick={() => boardState.reverseHistory(index)} key={index}
                                onMouseEnter={() => boardState.fakeRefresh(histObj.data)}
                                onMouseLeave={() => boardState.refresh()}
                            >
                                <h3> {`${index + 1}.`} {this.stateChangeName(prevChange)} </h3>
                                <p> {prevDetail} </p>
                            </a>
                        );
                    }).reverse()}
                </div>
            </div>
        );
    }

    private historyUpdater = (histObj: HistoryObject) => {
        const copy = this.state.history;
        copy.push(histObj);
        this.setState({ history: copy });
    };

    /* istanbul ignore next */
    private stateChangeName(change: StateChanges) {
        switch (change) {
            case StateChanges.BOARD_TITLE:
                return 'Changed board title';
            case StateChanges.COLUMN_COLOR:
                return 'Changed column color';
            case StateChanges.COLUMN_DELETED:
                return 'Deleted column';
            case StateChanges.COLUMN_TITLE:
                return 'Changed column title';
            case StateChanges.HISTORY_REVERSED:
                return 'Undid changes';
            case StateChanges.TASK_DELETED:
                return 'Deleted task';
            case StateChanges.TASK_TEXT:
                return 'Changed task text';
            case StateChanges.BOARD_LOADED:
                return 'Loaded Kanban';
            default:
                return 'ERROR';
        }
    }

    private openListener = () => this.setState({ open: true });
}


export default RevisionHistory;