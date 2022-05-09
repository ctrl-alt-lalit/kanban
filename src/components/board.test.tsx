import Board from '../components/board';
import { render } from '@testing-library/react';
import boardState from '../util/board-state';
import { createColumnJson, createKanbanJson } from '../util/kanban-types';
import userEvent from '@testing-library/user-event';
import { randomString } from '../test-helpers';

function* boardSetup() {
    const defaultKanban = createKanbanJson();
    boardState.save(defaultKanban);

    const wrapper = render(<Board />);
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

        const wrapper = render(<Board />);
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
            const spy = jest.spyOn(boardState, 'changeBoardTitle');

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

            spy.mockClear();
            setup.next();
        });

        it('can open revision history', () => {
            const setup = boardSetup();
            const board = setup.next().value as HTMLDivElement;

            const historyButton = board.querySelector('a.board-history-open')!;
            const spy = jest.spyOn(window, 'dispatchEvent');

            userEvent.click(historyButton);
            expect(spy).toHaveBeenCalled();
            setup.next();
        });

        it('can open and close the settings panel', () => {
            const setup = boardSetup();
            const board = setup.next().value as HTMLDivElement;

            const settingsButton = board.querySelector('a.board-settings-toggle')!;
            const settingsPanel = board.querySelector('.board-settings') as HTMLDivElement;

            expect(settingsPanel.style.opacity).toEqual('0');

            userEvent.click(settingsButton);
            expect(settingsPanel.style.opacity).toEqual('1');

            userEvent.click(settingsButton);
            expect(settingsPanel.style.opacity).toEqual('0');
            setup.next();
        });
    });

    describe('settings panel', () => {
        function* settingsSetup() {
            const setup = boardSetup();
            const board = setup.next().value as HTMLDivElement;

            const settingsButton = board.querySelector('a.board-settings-toggle')!;
            userEvent.click(settingsButton);

            const settingsPanel = board.querySelector('.board-settings') as HTMLDivElement;
            yield settingsPanel;

            setup.next();
        }

        it('can toggle autosave', () => {
            const setup = settingsSetup();
            const settings = setup.next().value as HTMLDivElement;

            const autosaveToggle = settings.querySelector('a.board-autosave')!;
            const spy = jest.spyOn(boardState, 'changeAutosave');

            userEvent.click(autosaveToggle);
            expect(spy).toHaveBeenCalled();
            setup.next();
        });

        it('can toggle save-to-file', () => {
            const setup = settingsSetup();
            const settings = setup.next().value as HTMLDivElement;

            const saveFileToggle = settings.querySelector('a.board-save-file')!;
            const spy = jest.spyOn(boardState, 'changeSaveToFile');

            userEvent.click(saveFileToggle);
            expect(spy).toHaveBeenCalled();
            setup.next();
        });
    });

    it('can add a column', () => {
        const setup = boardSetup();
        const board = setup.next().value as HTMLDivElement;

        const addButton = board.querySelector('a.board-add-column')!;
        const spy = jest.spyOn(boardState, 'addColumn');

        userEvent.click(addButton);
        expect(spy).toHaveBeenCalled();
    });

    // UserEvent not working with ctrl + S. Can't test save shortcut
});
