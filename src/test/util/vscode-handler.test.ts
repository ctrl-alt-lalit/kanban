import { createStrictKanbanJson } from "../../util/kanban-type-functions";
import VsCodeHandler from "../../util/vscode-handler";

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
        numPostMessage: () => postMessageCalls
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

    //How can I mock a window message?
});