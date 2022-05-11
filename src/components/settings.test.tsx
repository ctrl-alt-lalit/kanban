import SettingsPanel from './settings';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import boardState from '../util/board-state';
import { createColumnJson, createKanbanJson } from '../util/kanban-types';
import clone from 'just-clone';
import { randomString } from '../util/test-helpers';

function* panelSetup() {
    const wrapper = render(<SettingsPanel />);
    const histPanel = wrapper.container.firstElementChild as HTMLDivElement;
    yield histPanel;

    const histScroller = histPanel.querySelector('.history-scroller') as HTMLDivElement;
    yield histScroller;

    wrapper.unmount();
}

const togglePanel = () => window.dispatchEvent(new CustomEvent('toggle-settings'));

describe('SettingsPanel', () => {
    it('can open and close', () => {
        const it = panelSetup();
        const settings = it.next().value as HTMLDivElement;

        expect(parseInt(settings.style.maxWidth)).toBe(0);

        togglePanel();

        expect(parseInt(settings.style.maxWidth)).toBeGreaterThan(0);

        const closeButton = settings.querySelector('.settings-titlebar a')!;
        userEvent.click(closeButton);

        expect(parseInt(settings.style.maxWidth)).toBe(0);

        it.return();
    });

    it('can set and unset autosave', () => {
        const setup = panelSetup();
        const settings = setup.next().value as HTMLDivElement;
        togglePanel();

        const autosaveToggle = settings.querySelector('#settings-autosave') as HTMLAnchorElement;
        const spy = jest.spyOn(boardState, 'setAutosave');

        userEvent.click(autosaveToggle);
        expect(spy).toHaveBeenCalled();
        setup.return();
    });

    it('can set and unset save-to-file', () => {
        const setup = panelSetup();
        const settings = setup.next().value as HTMLDivElement;
        togglePanel();

        const fileToggle = settings.querySelector('#settings-savefile') as HTMLAnchorElement;
        const spy = jest.spyOn(boardState, 'setSaveToFile');

        userEvent.click(fileToggle);
        expect(spy).toHaveBeenCalled();
        setup.return();
    });
});
