import { decodeSigned12BitData, parseTelemetry, parseAccelerometer } from './muse-parse';

describe('decodeSigned12BitData', () => {
    it('should correctly decode 12-bit EEG samples received from muse', () => {
        const input = new Uint8Array([87, 33, 192, 82, 73, 6, 106, 242, 49, 64, 88, 153, 128, 66, 254, 44, 119, 157]);
        expect(decodeSigned12BitData(input)).toEqual([1394, 448, 1316, -1786, 1711, 561, 1029, -1895, -2044, 766, 711, 1949]);
    });
});

describe('parseTelemtry', () => {
    it('should correctly parse Muse telemetry data', () => {
        const input = new DataView(new Uint8Array([1, 74, 181, 184, 7, 64, 15, 127, 0, 27, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]).buffer);
        expect(parseTelemetry(input)).toEqual({
            sequenceId: 330,
            batteryLevel: 90.859375,
            fuelGaugeVoltage: 4083.2000000000003,
            temperature: 27
        });
    });
});

describe('parseAccelerometer', () => {
    it('should parse Muse accelerometer data correctly', () => {
        const input = new DataView(new Uint8Array([82, 109, 17, 227, 13, 157, 60, 115, 18, 5, 13, 73, 60, 53, 17, 183, 13, 178, 60, 143]).buffer);
        expect(parseAccelerometer(input)).toEqual({
            sequenceId: 21101,
            samples: [
                { x: 4579, y: 3485, z: 15475 },
                { x: 4613, y: 3401, z: 15413 },
                { x: 4535, y: 3506, z: 15503 },
            ]
        });
    });
})