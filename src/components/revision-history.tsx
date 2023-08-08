/**
 * @file Component that shows a list of edits the user has made since the board was opened.
 */

import clone from 'just-clone';
import React from 'react';
import boardState, { HistoryObject, StateChanges } from '../util/board-state';

/**
 * Shows a list of edits the user has made since the board was opened.
 */
export default class RevisionHistory extends React.Component<
    { isOpen: boolean; closeHistory: () => void },
    { history: HistoryObject[] }
> {
    /**
     * Creates internal copy of {@link boardState.history}
     */
    constructor(props: any) {
        super(props);

        this.state = {
            history: clone(boardState.history) as HistoryObject[],
        };
    }

    /**
     * Adds a listener for history updates, to keep list of edits up-to-date.
     */
    componentDidMount() {
        boardState.addHistoryUpdateListener(this.historyUpdater);
    }

    /**
     * Removes history update listener
     */
    componentWillUnmount() {
        boardState.removeHistoryUpdateListener(this.historyUpdater);
    }

    /**
     * @ignore
     */
    render(): JSX.Element {
        const style = {
            // CSS styles so that this panel will 'swipe' open and closed
            maxWidth: this.props.isOpen ? '25%' : 0,
            transition: 'max-width 0.3s ease 0s',
            pointerEvents: this.props.isOpen ? 'all' : 'none',
        } as const;

        return (
            <div className="history" style={style}>
                <div className="history-titlebar">
                    <a onClick={this.props.closeHistory} title="Hide Revision History">
                        <h1> Revision History </h1>
                        <span className="codicon codicon-chevron-right"></span>
                    </a>
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
                                onMouseEnter={() => {
                                    this.setBoardScanlines(true);
                                    boardState.displayKanban(histObj.data);
                                }}
                                onMouseLeave={() => {
                                    this.setBoardScanlines(false);
                                    boardState.refreshKanban();
                                }}
                            >
                                <div className="history-item-inside">
                                    <h3>{`${index + 1}. ${this.stateChangeName(prevChange)}`}</h3>
                                    <p> {prevDetail} </p>{' '}
                                </div>
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
                                <div className="history-item-inside">
                                    <h3>
                                        {`${this.state.history.length + 1}. ${mostRecentChange}`}
                                    </h3>
                                    <p> {mostRecentDetail} </p>
                                </div>
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
     * @ignore
     */
    private historyUpdater = (histObj: HistoryObject) => {
        const copy = this.state.history;
        copy.push(histObj);
        this.setState({ history: copy });
    };

    /**
     * @param change {StateChanges} what kind of change happened
     * @returns String representation for what StateChange happened
     * @ignore
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
            case StateChanges.AUTOSAVE:
            case StateChanges.SAVE_TO_FILE:
                return 'Settings Changed';
            default:
                return 'ERROR';
        }
    }

    private boardHtmlElement: HTMLElement | undefined = undefined;

    private setBoardScanlines(showScanlines: boolean) {
        if (!this.boardHtmlElement) {
            this.boardHtmlElement = document.querySelector('.board') as HTMLElement;
        }

        if (showScanlines) {
            this.boardHtmlElement.classList.add('scanlines');
        } else {
            this.boardHtmlElement.classList.remove('scanlines');
        }
    }
}
