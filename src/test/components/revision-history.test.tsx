import RevisionHistory from '../../components/revision-history';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import boardState from '../../util/board-state';
import { createStrictColumnJson, createStrictKanbanJson } from '../../util/kanban-type-functions';
import clone from 'just-clone';
import { randStr, wait } from '../helpers';


describe('Revision History', () => {

    it('can open and close', () => {
        const wrapper = render(<RevisionHistory />);
        const histPanel = wrapper.container.firstElementChild as HTMLDivElement;

        expect(parseInt(histPanel.style.maxWidth)).toBe(0);

        window.dispatchEvent(new CustomEvent('open-history'));

        expect(parseInt(histPanel.style.maxWidth)).toBeGreaterThan(0);

        const closeButton = histPanel.querySelector('.history-titlebar a')!;
        userEvent.click(closeButton);

        expect(parseInt(histPanel.style.maxWidth)).toBe(0);

        wrapper.unmount();
    });

    it('keeps track of changes and allows you to roll them back', () => {
        const wrapper = render(<RevisionHistory />);
        const histPanel = wrapper.container.firstElementChild as HTMLDivElement;

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

        const histScroller = histPanel.querySelector('.history-scroller') as HTMLDivElement;

        const numHistItems = histScroller.childElementCount;
        expect(numHistItems).toBe(boardState.getHistory().length);

        const secondToLast = Array.from(histScroller.childNodes)[numHistItems - 2] as HTMLAnchorElement;

        window.dispatchEvent(new CustomEvent('open-history'));
        userEvent.click(secondToLast);

        originalData.timestamp = boardState.getCurrentState().timestamp; //timestamp equality is NOT expected
        expect(boardState.getCurrentState()).toEqual(originalData);

        wrapper.unmount();
    });

    it('only keeps track of changes that would be difficult to reverse otherwise', async () => {
        const wrapper = render(<RevisionHistory />);
        const histPanel = wrapper.container.firstElementChild as HTMLDivElement;

        boardState.save(createStrictKanbanJson()); //1
        boardState.addColumn();

        boardState.changeBoardTitle(randStr()); //2

        const colId = boardState.getCurrentState().cols[0].id;
        boardState.changeColumnTitle(colId, randStr()); //3
        boardState.changeColumnColor(colId, 'red'); //4
        boardState.addTask(colId);
        boardState.removeTask(colId, boardState.getCurrentState().cols[0].tasks[0].id);
        boardState.addTask(colId);

        const taskId = boardState.getCurrentState().cols[0].tasks[0].id;
        boardState.changeTaskText(colId, taskId, randStr());
        await wait(1000);

        boardState.changeTaskText(colId, taskId, randStr()); //5
        await wait(1000);

        boardState.removeTask(colId, taskId); //6
        boardState.removeColumn(colId); //7

        boardState.reverseHistory(0);

        const histScroller = histPanel.querySelector('.history-scroller') as HTMLDivElement;
        expect(histScroller.childElementCount).toBe(boardState.getHistory().length);
    });
});