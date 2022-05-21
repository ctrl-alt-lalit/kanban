import Board from '../components/board';
import { render } from '@testing-library/react';
import boardState from '../util/board-state';
import { createColumnJson, createKanbanJson } from '../util/kanban-types';
import userEvent from '@testing-library/user-event';
import { randomString } from '../util/test-helpers';

jest.mock('react-markdown', () => (props: any) => {
    return <>{props.children}</>;
});

jest.mock('remark-gfm', () => () => {});
jest.mock('remark-breaks', () => () => {});

function* boardSetup() {
    const defaultKanban = createKanbanJson();
    boardState.save(defaultKanban);

    const wrapper = render(<Board toggleSettings={() => null} toggleHistory={() => null} />);
    const board = wrapper.container.firstElementChild as HTMLDivElement;
    yield board;

    wrapper.unmount();
}

describe('<Board />', () => {
    it('renders a board', () => {
        const kanbanData = createKanbanJson(randomString(), [
            createColumnJson(),
            createColumnJson(),
        ]);
        boardState.save(kanbanData);

        const wrapper = render(<Board toggleSettings={() => null} toggleHistory={() => null} />);
        const board = wrapper.container.firstElementChild as HTMLDivElement;

        const title = board.querySelector('input.board-title') as HTMLInputElement;
        expect(title.value).toEqual(kanbanData.title);

        const columnList = board.querySelector('.board-content')!;
        expect(columnList.childElementCount).toEqual(kanbanData.cols.length + 1); //add 1 for add-col btn
    });

    describe('titlebar', () => {
        it('has an editable title', () => {
            const setup = boardSetup();
            const board = setup.next().value as HTMLDivElement;

            const title = board.querySelector('input.board-title') as HTMLInputElement;
            const spy = jest.spyOn(boardState, 'setBoardTitle');

            userEvent.type(title, 'blah');
            title.blur();

            expect(spy).toHaveBeenCalled();
            setup.next();
        });

        it('can save the board', () => {
            const setup = boardSetup();
            const board = setup.next().value as HTMLDivElement;

            //make a change so save button is enabled
            const addButton = board.querySelector('a.board-add-column') as HTMLAnchorElement;
            userEvent.click(addButton);

            const saveButton = board.querySelector('a.board-save')!;
            const spy = jest.spyOn(boardState, 'save');

            userEvent.click(saveButton);
            expect(spy).toHaveBeenCalled();
            setup.next();
        });

        it('can open revision history', () => {
            const historyToggleMock = jest.fn();
            const wrapper = render(
                <Board toggleHistory={historyToggleMock} toggleSettings={() => null} />
            );
            const board = wrapper.container as HTMLDivElement;

            const historyButton = board.querySelector('a.board-history-open')!;
            userEvent.click(historyButton);
            expect(historyToggleMock).toHaveBeenCalled();
            wrapper.unmount();
        });

        it('can open and close the settings panel', () => {
            const settingsToggleMock = jest.fn();
            const wrapper = render(
                <Board toggleSettings={settingsToggleMock} toggleHistory={() => null} />
            );
            const board = wrapper.container as HTMLDivElement;

            const historyButton = board.querySelector('a.board-settings-toggle')!;
            userEvent.click(historyButton);
            expect(settingsToggleMock).toHaveBeenCalled();
            wrapper.unmount();
        });
    });

    it('can add a column', () => {
        const setup = boardSetup();
        const board = setup.next().value as HTMLDivElement;

        const addButton = board.querySelector('a.board-add-column')!;
        const spy = jest.spyOn(boardState, 'addColumn');

        userEvent.click(addButton);
        expect(spy).toHaveBeenCalled();
        setup.return();
    });
});
