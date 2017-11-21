import { decodeUnsigned12BitData, parseAccelerometer, parseControl, parseTelemetry } from './muse-parse';

import { from } from 'rxjs/observable/from';
import { toArray } from 'rxjs/operators/toArray';

describe('parseControl', () => {
    it('should correctly parse JSON responses into objects', async () => {
        const input = from([
            '{"ap":"headset",',
            '"sp":"RevE",',
            '"tp":"consumer",',
            '"hw":"3.1",',
            '"bn":27,',
            '"fw":"1.2.13",',
            '"bl":"1.2.3",',
            '"pv":1,',
            '"rc":0}',
            '{"rc":0}',
            '{"rc":0}',
            '{"hn":"Muse-1324",',
            '"sn":"2031-TZRW-132',
            '4",',
            '"ma":"00-55-da-b0-1',
            '3-24",',
            '"id":"07473435 3231',
            '3630 004f003a",',
            '"bp":82,',
            '"ts":0,',
            '"ps":32,',
            '"rc":0}{"r',
            'c":0}',
        ]);
        const results = await parseControl(input).pipe(toArray()).toPromise();
        expect(results).toEqual([
            {
                ap: 'headset', bl: '1.2.3', bn: 27, fw: '1.2.13', hw: '3.1',
                pv: 1, rc: 0, sp: 'RevE', tp: 'consumer',
            },
            { rc: 0 },
            { rc: 0 },
            {
                bp: 82, hn: 'Muse-1324', id: '07473435 32313630 004f003a',
                ma: '00-55-da-b0-13-24', ps: 32, rc: 0, sn: '2031-TZRW-1324', ts: 0,
            },
            { rc: 0 },
        ]);
    });
});

describe('decodeUnsigned12BitData', () => {
    it('should correctly decode 12-bit EEG samples received from muse', () => {
        const input = new Uint8Array([87, 33, 192, 82, 73, 6, 106, 242, 49, 64, 88, 153, 128, 66, 254, 44, 119, 157]);
        expect(decodeUnsigned12BitData(input))
            .toEqual([1394, 448, 1316, 2310, 1711, 561, 1029, 2201, 2052, 766, 711, 1949]);
    });
});

describe('parseTelemtry', () => {
    it('should correctly parse Muse telemetry data', () => {
        const input = new DataView(
            new Uint8Array([1, 74, 181, 184, 7, 64, 15, 127, 0, 27, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]).buffer);
        expect(parseTelemetry(input)).toEqual({
            batteryLevel: 90.859375,
            fuelGaugeVoltage: 4083.2000000000003,
            sequenceId: 330,
            temperature: 27,
        });
    });
});

describe('parseAccelerometer', () => {
    it('should parse Muse accelerometer data correctly', () => {
        const input = new DataView(
            new Uint8Array([82, 109, 17, 227, 13, 157, 60, 115, 18, 5, 13, 73, 60, 53, 17,
                183, 13, 178, 60, 143]).buffer);
        expect(parseAccelerometer(input)).toEqual({
            samples: [
                { x: 4579, y: 3485, z: 15475 },
                { x: 4613, y: 3401, z: 15413 },
                { x: 4535, y: 3506, z: 15503 },
            ],
            sequenceId: 21101,
        });
    });
});
