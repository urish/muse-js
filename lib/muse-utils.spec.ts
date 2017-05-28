import { decodeSigned12BitData, encodeCommand } from './muse-utils';

import { TextEncoder, TextDecoder } from 'text-encoding'; // polyfill

declare var global: any;
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

describe('decodeSigned12BitData', () => {
    it('should correctly decode 12-bit EEG samples received from muse', () => {
        const input = new Uint8Array([87, 33, 192, 82, 73, 6, 106, 242, 49, 64, 88, 153, 128, 66, 254, 44, 119, 157]);
        expect(decodeSigned12BitData(input)).toEqual([1394, 448, 1316, -1786, 1711, 561, 1029, -1895, -2044, 766, 711, 1949]);
    });
});

describe('encodeCommand', () => {
    it('should correctly encode the given command as a Uint8Array', () => {
        expect(encodeCommand('v1')).toEqual(new Uint8Array([3, 118, 49, 10]));
    })
});
