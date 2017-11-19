import { encodeCommand } from './muse-utils';

import { TextDecoder, TextEncoder } from 'text-encoding'; // polyfill

declare var global: any;
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

describe('encodeCommand', () => {
    it('should correctly encode the given command as a Uint8Array', () => {
        expect(encodeCommand('v1')).toEqual(new Uint8Array([3, 118, 49, 10]));
    });
});
