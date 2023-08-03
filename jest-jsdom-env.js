import JsDomBaseEnv from 'jest-environment-jsdom';
import { TextEncoder, TextDecoder } from 'util';

Object.defineProperty(exports, '__esModule', { value: true });

/**
 * Have to override some global properties due to issues with the Jest JSDOM Environment.
 * Uint8Array: https://github.com/paralleldrive/cuid2/issues/44
 * TextEncoder/Decoder: https://github.com/jsdom/jsdom/issues/2524
 */
class JsDomOverrideEnv extends JsDomBaseEnv {
    constructor(...args) {
        const { global } = super(...args);

        global.Uint8Array = Uint8Array;
        global.TextEncoder = TextEncoder;
        global.TextDecoder = TextDecoder;
    }
}

export { JsDomOverrideEnv as default };
export const TestEnvironment = JsDomOverrideEnv;