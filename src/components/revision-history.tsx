import React from 'react';
import boardState, { HistoryObject, StateChanges } from '../util/board-state';

/**
 * React component showing a list of edits the user has made since the board was opened.
 */
class RevisionHistory extends React.Component<{}, { history: HistoryObject[]; open: boolean }> {
    /* Create the component and make it listen for open event */
    constructor(props: never) {
        super(props);

        this.state = {
            history: boardState.getHistory(),
            open: false,
        };
    }

    componentDidMount() {
        window.addEventListener('toggle-history', this.toggleListener);
        boardState.addHistoryUpdateListener(this.historyUpdater);
    }

    componentWillUnmount() {
        window.removeEventListener('toggle-history', this.toggleListener);
        boardState.removeHistoryUpdateListener(this.historyUpdater);
    }

    render(): JSX.Element {
        const style = {
            // CSS styles so that this panel will 'swipe' open and closed
            maxWidth: this.state.open ? '25%' : 0,
            transition: 'max-width 0.3s ease 0s',
            pointerEvents: this.state.open ? 'all' : 'none',
        } as const;

        return (
            <div className="history" style={style}>
                <div className="history-titlebar">
                    <a onClick={() => this.setState({ open: false })} title="Hide Revision History">
                        <span className="codicon codicon-chevron-right"></span>
                    </a>
                    <h1> Revision History </h1>
                </div>
                <div className="history-scroller">
                    {this.state.history.map((histObj, index) => {
                        const prevHist = index > 0 ? this.state.history[index - 1] : null;
                        const prevChange = prevHist ? prevHist.change : StateChanges.BOARD_LOADED;
                        const prevDetail = prevHist ? prevHist.details : '';

                        return (
                            <a
                                className="history-item"
                                onClick={() => boardState.rollBackHistory(index)}
                                key={index}
                                onMouseEnter={() => boardState.displayKanban(histObj.data)}
                                onMouseLeave={() => boardState.refreshKanban()}
                            >
                                <h3>{`${index + 1}. ${this.stateChangeName(prevChange)}`}</h3>
                                <p> {prevDetail} </p>
                            </a>
                        );
                    })}

                    {(() => {
                        const mostRecent =
                            this.state.history.length > 0
                                ? this.state.history[this.state.history.length - 1]
                                : null;
                        const mostRecentChange = mostRecent
                            ? `${this.stateChangeName(mostRecent.change)} (Current Kanban)`
                            : 'Current Kanban';
                        const mostRecentDetail = mostRecent ? mostRecent.details : '';
                        return (
                            <a
                                className="history-item"
                                key={this.state.history.length + 1}
                                onMouseEnter={() => boardState.refreshKanban()}
                                onMouseLeave={() => boardState.refreshKanban()}
                            >
                                <h3> {`${this.state.history.length + 1}. ${mostRecentChange}`}</h3>
                                <p> {mostRecentDetail} </p>
                            </a>
                        );
                    })()}
                </div>
            </div>
        );
    }

    /**
     * Callback to be connected to BoardState that updates this panel's
     * history list when a user makes a change.
     *
     * @param histObj {HistoryObject} HistoryObject to append to history
     */
    private historyUpdater = (histObj: HistoryObject) => {
        const copy = this.state.history;
        copy.push(histObj);
        this.setState({ history: copy });
    };

    /**
     * @param change {StateChanges} what kind of change happened
     * @returns String representation for what StateChange happened
     */
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
            case StateChanges.COLUMN_MOVED:
                return 'Moved Column';
            default:
                return 'ERROR';
        }
    }

    /* Callback for when the open event is fired */
    private toggleListener = () => this.setState({ open: !this.state.open });
}

export default RevisionHistory;
