import RevisionHistory from '../../components/revision-history';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import boardState from '../../util/board-state';
import { createStrictColumnJson, createStrictKanbanJson } from '../../util/kanban-type-functions';
import clone from 'just-clone';
import { randomString } from '../helpers';

jest.mock('../../util/delayed-updater');
import DelayedUpdater from '../../util/delayed-updater';
(DelayedUpdater as any).mockImplementation(() => {
    return {
        tryUpdate: (callback: () => void) => {
            callback();
        }
    };
});

function* panelSetup() {
    const wrapper = render(<RevisionHistory />);
    const histPanel = wrapper.container.firstElementChild as HTMLDivElement;
    yield histPanel;

    const histScroller = histPanel.querySelector('.history-scroller') as HTMLDivElement;
    yield histScroller;

    wrapper.unmount();
}

const openPanel = () => window.dispatchEvent(new CustomEvent('open-history'));

describe('Revision History', () => {

    it('can open and close', () => {
        const it = panelSetup();
        const histPanel = it.next().value!;

        expect(parseInt(histPanel.style.maxWidth)).toBe(0);

        openPanel();

        expect(parseInt(histPanel.style.maxWidth)).toBeGreaterThan(0);

        const closeButton = histPanel.querySelector('.history-titlebar a')!;
        userEvent.click(closeButton);

        expect(parseInt(histPanel.style.maxWidth)).toBe(0);

        it.return();
    });

    it('keeps track of changes and allows you to roll them back', () => {
        const it = panelSetup();
        it.next();

        const originalData = createStrictKanbanJson(
            'blah',
            [createStrictColumnJson(), createStrictColumnJson()],
        );

        boardState.save(clone(originalData));
        boardState.removeColumn(originalData.cols[0].id);

        const numUndos = Math.ceil(Math.random() * 15 + 10);
        for (let i = 0; i < numUndos; ++i) {
            boardState.reverseHistory(1);
        }

        const histScroller = it.next().value!;

        const numHistItems = histScroller.childElementCount;
        expect(numHistItems).toBe(boardState.getHistory().length);

        const secondToLast = Array.from(histScroller.childNodes)[numHistItems - 2] as HTMLAnchorElement;

        window.dispatchEvent(new CustomEvent('open-history'));
        userEvent.click(secondToLast);

        originalData.timestamp = boardState.getCurrentState().timestamp; //timestamp equality is NOT expected
        expect(boardState.getCurrentState()).toEqual(originalData);

        it.return();
    });

    it("keeps track of all changes in a board state's history", () => {
        const it = panelSetup();
        it.next();

        boardState.save(createStrictKanbanJson());
        boardState.addColumn();

        boardState.changeBoardTitle(randomString());

        const colId = boardState.getCurrentState().cols[0].id;
        boardState.changeColumnTitle(colId, randomString());
        boardState.changeColumnColor(colId, 'red');
        boardState.addTask(colId);
        boardState.removeTask(colId, boardState.getCurrentState().cols[0].tasks[0].id);
        boardState.addTask(colId);

        const taskId = boardState.getCurrentState().cols[0].tasks[0].id;
        boardState.changeTaskText(colId, taskId, randomString());

        boardState.changeTaskText(colId, taskId, randomString());

        boardState.removeTask(colId, taskId);
        boardState.removeColumn(colId);

        boardState.reverseHistory(0);

        const histScroller = it.next().value!;
        expect(histScroller.childElementCount).toBe(boardState.getHistory().length);

        it.return();
    });

    it('previews a previous state on hover', () => {
        const it = panelSetup();
        it.next();
        const histScroller = it.next().value!;
        openPanel();

        const fakeRefreshSpy = jest.spyOn(boardState, 'fakeRefresh');
        const refreshSpy = jest.spyOn(boardState, 'refresh');

        boardState.addColumn();
        boardState.removeColumn(boardState.getCurrentState().cols[0].id);
        const histItem = histScroller.querySelector('.history-item')!;

        userEvent.hover(histItem);
        expect(fakeRefreshSpy).toHaveBeenCalled();

        userEvent.unhover(histItem);
        expect(refreshSpy).toHaveBeenCalled();

        it.return();
    });
});