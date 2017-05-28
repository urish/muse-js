import { decodeSigned12BitData, parseTelemetry } from './muse-parse';


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
