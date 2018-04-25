import { from } from 'rxjs';
import { toArray } from 'rxjs/operators';

import {
    decodeUnsigned12BitData,
    parseAccelerometer,
    parseControl,
    parseGyroscope,
    parseTelemetry,
} from './muse-parse';

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
        const results = await parseControl(input)
            .pipe(toArray())
            .toPromise();
        expect(results).toEqual([
            {
                ap: 'headset',
                bl: '1.2.3',
                bn: 27,
                fw: '1.2.13',
                hw: '3.1',
                pv: 1,
                rc: 0,
                sp: 'RevE',
                tp: 'consumer',
            },
            { rc: 0 },
            { rc: 0 },
            {
                bp: 82,
                hn: 'Muse-1324',
                id: '07473435 32313630 004f003a',
                ma: '00-55-da-b0-13-24',
                ps: 32,
                rc: 0,
                sn: '2031-TZRW-1324',
                ts: 0,
            },
            { rc: 0 },
        ]);
    });
});

describe('decodeUnsigned12BitData', () => {
    it('should correctly decode 12-bit EEG samples received from muse', () => {
        const input = new Uint8Array([87, 33, 192, 82, 73, 6, 106, 242, 49, 64, 88, 153, 128, 66, 254, 44, 119, 157]);
        expect(decodeUnsigned12BitData(input)).toEqual([
            1394,
            448,
            1316,
            2310,
            1711,
            561,
            1029,
            2201,
            2052,
            766,
            711,
            1949,
        ]);
    });
});

describe('parseTelemtry', () => {
    it('should correctly parse Muse telemetry data', () => {
        const input = new DataView(
            new Uint8Array([1, 74, 181, 184, 7, 64, 15, 127, 0, 27, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]).buffer,
        );
        expect(parseTelemetry(input)).toEqual({
            batteryLevel: 90.859375,
            fuelGaugeVoltage: 4083.2000000000003,
            sequenceId: 330,
            temperature: 27,
        });
    });
});

describe('parseAccelerometer', () => {
    it('should parse Muse accelerometer data and return (x,y,z) vectors in g units', () => {
        const input = new DataView(
            new Uint8Array([
                82,
                109,
                13,
                178,
                13,
                157,
                60,
                115,
                18,
                5,
                13,
                73,
                60,
                53,
                17,
                183,
                17,
                227,
                60,
                143,
            ]).buffer,
        );
        expect(parseAccelerometer(input)).toEqual({
            samples: [
                { x: 0.2139894112, y: 0.21270767200000001, z: 0.9445197200000001 },
                { x: 0.2815553776, y: 0.20758071520000002, z: 0.9407355376000001 },
                { x: 0.276794632, y: 0.27948018080000003, z: 0.9462287056 },
            ],
            sequenceId: 21101,
        });
    });
});

describe('parseGyroscope', () => {
    it('should parse Muse gyroscope data and return (x,y,z) vectors in deg/second units', () => {
        const input = new DataView(
            new Uint8Array([1, 109, 5, 12, 0, 157, 0, 115, 5, 5, 0, 73, 0, 53, 5, 183, 0, 227, 0, 143]).buffer,
        );
        expect(parseGyroscope(input)).toEqual({
            samples: [
                { x: 9.660025599999999, y: 1.1738575999999998, z: 0.8598319999999999 },
                { x: 9.607688, y: 0.5458064, z: 0.39627039999999997 },
                { x: 10.9385584, y: 1.6972336, z: 1.0691823999999999 },
            ],
            sequenceId: 365,
        });
    });
});
