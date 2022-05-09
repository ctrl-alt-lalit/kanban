import { createStrictKanbanJson, StrictKanbanJSON } from '../util/kanban-type-functions';
import VsCodeHandler from '../util/vscode-handler';

const VsCodeApiMock = () => {
    let setStateCalls = 0;
    let getStateCalls = 0;
    let postMessageCalls = 0;

    return {
        getState: () => ++getStateCalls,
        setState: () => ++setStateCalls,
        postMessage: () => ++postMessageCalls,
        numGetState: () => getStateCalls,
        numSetState: () => setStateCalls,
        numPostMessage: () => postMessageCalls,
    };
};

describe('VsCodeHandler', () => {
    it('sends messages to the Extension Host', () => {
        const api = VsCodeApiMock();
        const vscode = new VsCodeHandler(api);

        vscode.save(createStrictKanbanJson());
        expect(api.numPostMessage()).toBe(1);

        vscode.load();
        expect(api.numPostMessage()).toBe(2);
    });

    it('can load a default kanban board', () => {
        const vscode = new VsCodeHandler(VsCodeApiMock());

        const event = new CustomEvent('message') as any; //force event to have a "data" attribute
        event.data = { command: 'load' };

        const listener = jest.fn();

        vscode.addLoadListener(listener);
        window.dispatchEvent(event);
        expect(listener).toHaveBeenCalledTimes(1);

        vscode.removeLoadListener(listener);
        window.dispatchEvent(event);
        expect(listener).toHaveBeenCalledTimes(1);
    });

    it('can load a pre-existing board', () => {
        const vscode = new VsCodeHandler(VsCodeApiMock());

        const event = new CustomEvent('message') as any;
        const expected = createStrictKanbanJson(Math.random().toString(36));
        event.data = { command: 'load', data: expected };

        let result: StrictKanbanJSON | null = null;
        const listener = (kanban: StrictKanbanJSON) => (result = kanban);

        vscode.addLoadListener(listener);
        window.dispatchEvent(event);
        expect(result).toEqual(expected);
    });

    it('only loads data with a "load" command', () => {
        const vscode = new VsCodeHandler(VsCodeApiMock());

        const event = new CustomEvent('message') as any;
        event.data = { command: 'invalid' };

        const listener = jest.fn();
        vscode.addLoadListener(listener);
        window.dispatchEvent(event);
        expect(listener).not.toHaveBeenCalled();
    });
});
