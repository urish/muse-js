import { EEGReading } from './../dist/lib/muse-interfaces.d';
import { MuseClient } from './muse';
import { WebBluetoothMock, DeviceMock } from './web-bluetooth.mock';
import { TextEncoder, TextDecoder } from 'text-encoding';

declare var global;

let museDevice: DeviceMock;

describe('MuseClient', () => {
    beforeEach(() => {
        museDevice = new DeviceMock('Muse-Test', [0xfe8d]);
        global.navigator = global.navigator || {};
        global.navigator.bluetooth = new WebBluetoothMock([museDevice]);
        Object.assign(global, { TextDecoder, TextEncoder });
    });

    describe('connect', () => {
        it('should connect to EEG headset', async () => {
            const client = new MuseClient();
            await client.connect();
        });

        it('should call startNotifications() on the EEG electrode characteritics', async () => {
            const service = museDevice.getServiceMock(0xfe8d);
            const eeg1Char = service.getCharacteristicMock('273e0003-4c4d-454d-96be-f03bac821358');
            eeg1Char.startNotifications = jest.fn();

            const client = new MuseClient();
            await client.connect();

            expect(eeg1Char.startNotifications).toHaveBeenCalled();
        });

        it('should not call startNotifications() on the Aux EEG electrode by default', async () => {
            const service = museDevice.getServiceMock(0xfe8d);
            const eegAuxChar = service.getCharacteristicMock('273e0007-4c4d-454d-96be-f03bac821358');
            eegAuxChar.startNotifications = jest.fn();

            const client = new MuseClient();
            await client.connect();

            expect(eegAuxChar.startNotifications).not.toHaveBeenCalled();
        });

        it('should call startNotifications() on the Aux EEG electrode when enableAux is set to true', async () => {
            const service = museDevice.getServiceMock(0xfe8d);
            const eegAuxChar = service.getCharacteristicMock('273e0007-4c4d-454d-96be-f03bac821358');
            eegAuxChar.startNotifications = jest.fn();

            const client = new MuseClient();
            client.enableAux = true;
            await client.connect();

            expect(eegAuxChar.startNotifications).toHaveBeenCalled();
        });
    });

    describe('start', async () => {
        it('should send `h`, `s`, `p20` and `d` commands to the EEG headset', async () => {
            const client = new MuseClient();
            const controlCharacteristic = museDevice.getServiceMock(0xfe8d).getCharacteristicMock('273e0001-4c4d-454d-96be-f03bac821358');
            controlCharacteristic.writeValue = jest.fn();
            await client.connect();
            await client.start();

            function charCodes(s) {
                return s.split('').map(c => c.charCodeAt(0));
            }

            expect(controlCharacteristic.writeValue)
                .toHaveBeenCalledWith(new Uint8Array([2, ...charCodes('h'), 10]));
            expect(controlCharacteristic.writeValue)
                .toHaveBeenCalledWith(new Uint8Array([2, ...charCodes('s'), 10]));
            expect(controlCharacteristic.writeValue)
                .toHaveBeenCalledWith(new Uint8Array([4, ...charCodes('p20'), 10]));
            expect(controlCharacteristic.writeValue)
                .toHaveBeenCalledWith(new Uint8Array([2, ...charCodes('d'), 10]));
        });
    });

    describe('eegReadings', () => {
        it('should emit a value for `eegReadings` observable whenever new EEG data is received', async () => {
            const service = museDevice.getServiceMock(0xfe8d);
            const eeg3Char = service.getCharacteristicMock('273e0006-4c4d-454d-96be-f03bac821358');

            const client = new MuseClient();
            await client.connect();

            let lastReading: EEGReading;
            client.eegReadings.subscribe(reading => {
                lastReading = reading;
            });

            eeg3Char.value = new DataView(new Uint8Array([0, 1, 40, 3, 128, 40, 3, 128, 40, 3, 128, 40, 3, 128, 40, 3, 128, 40, 3, 128]).buffer);
            const beforeDispatchTime = new Date().getTime();
            eeg3Char.dispatchEvent(new CustomEvent('characteristicvaluechanged'));
            const afterDispatchTime = new Date().getTime();

            expect(lastReading).toEqual({
                index: 1,
                timestamp: expect.any(Number),
                electrode: 3,
                samples: [-687.5, -562.5, -687.5, -562.5, -687.5, -562.5, -687.5, -562.5, -687.5, -562.5, -687.5, -562.5,]
            });

            // Timestamp should be about (1000/256.0*12) miliseconds behind the event dispatch time
            expect(lastReading.timestamp).toBeGreaterThanOrEqual(beforeDispatchTime - (1000 / 256.0 * 12));
            expect(lastReading.timestamp).toBeLessThanOrEqual(afterDispatchTime - (1000 / 256.0 * 12));
        });

        it('should report the same timestamp for eeg events with the same sequence', async () => {
            const service = museDevice.getServiceMock(0xfe8d);
            const eeg1Char = service.getCharacteristicMock('273e0004-4c4d-454d-96be-f03bac821358');
            const eeg3Char = service.getCharacteristicMock('273e0006-4c4d-454d-96be-f03bac821358');

            const client = new MuseClient();
            await client.connect();

            let readings: EEGReading[] = [];
            client.eegReadings.subscribe(reading => {
                readings.push(reading);
            });

            eeg1Char.value = new DataView(new Uint8Array([0, 15]).buffer);
            eeg1Char.dispatchEvent(new CustomEvent('characteristicvaluechanged'));
            eeg3Char.value = new DataView(new Uint8Array([0, 15]).buffer);
            eeg3Char.dispatchEvent(new CustomEvent('characteristicvaluechanged'));

            expect(readings.length).toBe(2);
            expect(readings[0].electrode).toBe(1);
            expect(readings[1].electrode).toBe(3);
            expect(readings[0].timestamp).toEqual(readings[1].timestamp);
        });

        it('should bump the timestamp for subsequent EEG events', async () => {
            const service = museDevice.getServiceMock(0xfe8d);
            const eeg1Char = service.getCharacteristicMock('273e0004-4c4d-454d-96be-f03bac821358');

            const client = new MuseClient();
            await client.connect();

            let readings: EEGReading[] = [];
            client.eegReadings.subscribe(reading => {
                readings.push(reading);
            });

            eeg1Char.value = new DataView(new Uint8Array([0, 15]).buffer);
            eeg1Char.dispatchEvent(new CustomEvent('characteristicvaluechanged'));
            eeg1Char.value = new DataView(new Uint8Array([0, 16]).buffer);
            eeg1Char.dispatchEvent(new CustomEvent('characteristicvaluechanged'));

            expect(readings[1].timestamp - readings[0].timestamp).toEqual(1000 / (256.0 / 12.0));
        });

        it('should correctly handle out-of-order EEG events', async () => {
            const service = museDevice.getServiceMock(0xfe8d);
            const eeg1Char = service.getCharacteristicMock('273e0004-4c4d-454d-96be-f03bac821358');

            const client = new MuseClient();
            await client.connect();

            let readings: EEGReading[] = [];
            client.eegReadings.subscribe(reading => {
                readings.push(reading);
            });

            eeg1Char.value = new DataView(new Uint8Array([0, 20]).buffer);
            eeg1Char.dispatchEvent(new CustomEvent('characteristicvaluechanged'));
            eeg1Char.value = new DataView(new Uint8Array([0, 16]).buffer);
            eeg1Char.dispatchEvent(new CustomEvent('characteristicvaluechanged'));

            expect(readings[1].timestamp - readings[0].timestamp).toEqual(-4 * 1000 / (256.0 / 12.0));
        });

        it('should handle timestamp wraparound', async () => {
            const service = museDevice.getServiceMock(0xfe8d);
            const eeg1Char = service.getCharacteristicMock('273e0004-4c4d-454d-96be-f03bac821358');

            const client = new MuseClient();
            await client.connect();

            let readings: EEGReading[] = [];
            client.eegReadings.subscribe(reading => {
                readings.push(reading);
            });

            eeg1Char.value = new DataView(new Uint8Array([0xff, 0xff]).buffer);
            eeg1Char.dispatchEvent(new CustomEvent('characteristicvaluechanged'));
            eeg1Char.value = new DataView(new Uint8Array([0, 0]).buffer);
            eeg1Char.dispatchEvent(new CustomEvent('characteristicvaluechanged'));

            expect(readings[1].timestamp - readings[0].timestamp).toEqual(1000 / (256.0 / 12.0));
        });
    });
});
