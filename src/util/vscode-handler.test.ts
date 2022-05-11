import { createKanbanJson, KanbanJson } from './kanban-types';

let setStateCalls = 0;
let getStateCalls = 0;
let postMessageCalls = 0;

/*
 * Create a fake 'acquireVsCodeApi()' to be used by VsCodeHandler.
 *
 * This declaration must come before importing VsCodeHandler.
 * It also generates a typescript compile error.
 */
//@ts-ignore
globalThis.acquireVsCodeApi = () => {
    return {
        getState: () => ++getStateCalls,
        setState: () => ++setStateCalls,
        postMessage: () => ++postMessageCalls,
    };
};

import VsCodeHandler from '../util/vscode-handler';

describe('VsCodeHandler', () => {
    it('sends messages to the Extension Host', () => {
        VsCodeHandler.save(createKanbanJson());
        expect(postMessageCalls).toEqual(1);

        VsCodeHandler.load();
        expect(postMessageCalls).toEqual(2);
        postMessageCalls = 0;
    });

    it('can load a default kanban board', () => {
        const event = new CustomEvent('message') as any; //force event to have a "data" attribute
        event.data = { command: 'load' };

        const listener = jest.fn();

        VsCodeHandler.addLoadListener(listener);
        window.dispatchEvent(event);
        expect(listener).toHaveBeenCalledTimes(1);

        VsCodeHandler.removeLoadListener(listener);
        window.dispatchEvent(event);
        expect(listener).toHaveBeenCalledTimes(1);
    });

    it('can load a pre-existing board', () => {
        const event = new CustomEvent('message') as any;
        const expected = createKanbanJson(Math.random().toString(36));
        event.data = { command: 'load', data: expected };

        let result: KanbanJson | null = null;
        const listener = (kanban: KanbanJson) => (result = kanban);

        VsCodeHandler.addLoadListener(listener);
        window.dispatchEvent(event);
        expect(result).toEqual(expected);
    });

    it('only loads data with a "load" command', () => {
        const event = new CustomEvent('message') as any;
        event.data = { command: 'invalid' };

        const listener = jest.fn();
        VsCodeHandler.addLoadListener(listener);
        window.dispatchEvent(event);
        expect(listener).not.toHaveBeenCalled();
    });
});
