import { TextDecoder, TextEncoder } from 'text-encoding';
import { DeviceMock, WebBluetoothMock } from 'web-bluetooth-mock';
import { EEGReading } from './../dist/lib/muse-interfaces.d';
import { MuseClient } from './muse';

declare var global;

let museDevice: DeviceMock;

function charCodes(s) {
    return s.split('').map((c) => c.charCodeAt(0));
}

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
        it('should send `h`, `s`, `p21` and `d` commands to the EEG headset', async () => {
            const client = new MuseClient();
            const controlCharacteristic = museDevice
                .getServiceMock(0xfe8d)
                .getCharacteristicMock('273e0001-4c4d-454d-96be-f03bac821358');
            controlCharacteristic.writeValue = jest.fn();

            await client.connect();
            await client.start();

            expect(controlCharacteristic.writeValue).toHaveBeenCalledWith(new Uint8Array([2, ...charCodes('h'), 10]));
            expect(controlCharacteristic.writeValue).toHaveBeenCalledWith(new Uint8Array([2, ...charCodes('s'), 10]));
            expect(controlCharacteristic.writeValue).toHaveBeenCalledWith(new Uint8Array([4, ...charCodes('p21'), 10]));
            expect(controlCharacteristic.writeValue).toHaveBeenCalledWith(new Uint8Array([2, ...charCodes('d'), 10]));
        });

        it('choose preset number 20 instead of 21 if aux is enabled', async () => {
            const client = new MuseClient();
            const controlCharacteristic = museDevice
                .getServiceMock(0xfe8d)
                .getCharacteristicMock('273e0001-4c4d-454d-96be-f03bac821358');
            controlCharacteristic.writeValue = jest.fn();

            client.enableAux = true;
            await client.connect();
            await client.start();

            expect(controlCharacteristic.writeValue).toHaveBeenCalledWith(new Uint8Array([4, ...charCodes('p20'), 10]));
            expect(controlCharacteristic.writeValue).not.toHaveBeenCalledWith(
                new Uint8Array([4, ...charCodes('p21'), 10]),
            );
        });
    });

    describe('eegReadings', () => {
        it('should emit a value for `eegReadings` observable whenever new EEG data is received', async () => {
            const service = museDevice.getServiceMock(0xfe8d);
            const eeg3Char = service.getCharacteristicMock('273e0006-4c4d-454d-96be-f03bac821358');

            const client = new MuseClient();
            await client.connect();

            let lastReading: EEGReading;
            client.eegReadings.subscribe((reading) => {
                lastReading = reading;
            });

            eeg3Char.value = new DataView(
                new Uint8Array([0, 1, 40, 3, 128, 40, 3, 128, 40, 3, 128, 40, 3, 128, 40, 3, 128, 40, 3, 128]).buffer,
            );
            const beforeDispatchTime = new Date().getTime();
            eeg3Char.dispatchEvent(new CustomEvent('characteristicvaluechanged'));
            const afterDispatchTime = new Date().getTime();

            expect(lastReading).toEqual({
                electrode: 3,
                index: 1,
                samples: [
                    -687.5,
                    -562.5,
                    -687.5,
                    -562.5,
                    -687.5,
                    -562.5,
                    -687.5,
                    -562.5,
                    -687.5,
                    -562.5,
                    -687.5,
                    -562.5,
                ],
                timestamp: expect.any(Number),
            });

            // Timestamp should be about (1000/256.0*12) milliseconds behind the event dispatch time
            expect(lastReading.timestamp).toBeGreaterThanOrEqual(beforeDispatchTime - 1000 / 256.0 * 12);
            expect(lastReading.timestamp).toBeLessThanOrEqual(afterDispatchTime - 1000 / 256.0 * 12);
        });

        it('should report the same timestamp for eeg events with the same sequence', async () => {
            const service = museDevice.getServiceMock(0xfe8d);
            const eeg1Char = service.getCharacteristicMock('273e0004-4c4d-454d-96be-f03bac821358');
            const eeg3Char = service.getCharacteristicMock('273e0006-4c4d-454d-96be-f03bac821358');

            const client = new MuseClient();
            await client.connect();

            const readings: EEGReading[] = [];
            client.eegReadings.subscribe((reading) => {
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

            const readings: EEGReading[] = [];
            client.eegReadings.subscribe((reading) => {
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

            const readings: EEGReading[] = [];
            client.eegReadings.subscribe((reading) => {
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

            const readings: EEGReading[] = [];
            client.eegReadings.subscribe((reading) => {
                readings.push(reading);
            });

            eeg1Char.value = new DataView(new Uint8Array([0xff, 0xff]).buffer);
            eeg1Char.dispatchEvent(new CustomEvent('characteristicvaluechanged'));
            eeg1Char.value = new DataView(new Uint8Array([0, 0]).buffer);
            eeg1Char.dispatchEvent(new CustomEvent('characteristicvaluechanged'));

            expect(readings[1].timestamp - readings[0].timestamp).toEqual(1000 / (256.0 / 12.0));
        });
    });

    describe('deviceInfo', () => {
        it('should return information about the headset', async () => {
            const service = museDevice.getServiceMock(0xfe8d);
            const controlCharacteristic = service.getCharacteristicMock('273e0001-4c4d-454d-96be-f03bac821358');
            jest.spyOn(controlCharacteristic, 'writeValue');

            const client = new MuseClient();
            await client.connect();
            const deviceInfoPromise = client.deviceInfo();

            expect(controlCharacteristic.writeValue).toHaveBeenCalledWith(new Uint8Array([3, ...charCodes('v1'), 10]));

            const deviceResponse = [
                [16, 123, 34, 97, 112, 34, 58, 34, 104, 101, 97, 100, 115, 101, 116, 34, 44, 50, 51, 49],
                [12, 34, 115, 112, 34, 58, 34, 82, 101, 118, 69, 34, 44, 101, 116, 34, 44, 50, 51, 49],
                [16, 34, 116, 112, 34, 58, 34, 99, 111, 110, 115, 117, 109, 101, 114, 34, 44, 50, 51, 49],
                [11, 34, 104, 119, 34, 58, 34, 51, 46, 49, 34, 44, 109, 101, 114, 34, 44, 50, 51, 49],
                [8, 34, 98, 110, 34, 58, 50, 55, 44, 49, 34, 44, 109, 101, 114, 34, 44, 50, 51, 49],
                [14, 34, 102, 119, 34, 58, 34, 49, 46, 50, 46, 49, 51, 34, 44, 34, 44, 50, 51, 49],
                [13, 34, 98, 108, 34, 58, 34, 49, 46, 50, 46, 51, 34, 44, 44, 34, 44, 50, 51, 49],
                [7, 34, 112, 118, 34, 58, 49, 44, 46, 50, 46, 51, 34, 44, 44, 34, 44, 50, 51, 49],
                [7, 34, 114, 99, 34, 58, 48, 125, 46, 50, 46, 51, 34, 44, 44, 34, 44, 50, 51, 49],
            ];

            deviceResponse.forEach((data) => {
                controlCharacteristic.value = new DataView(new Uint8Array(data).buffer);
                controlCharacteristic.dispatchEvent(new CustomEvent('characteristicvaluechanged'));
            });

            const deviceInfo = await deviceInfoPromise;
            expect(deviceInfo).toEqual({
                ap: 'headset',
                bl: '1.2.3',
                bn: 27,
                fw: '1.2.13',
                hw: '3.1',
                pv: 1,
                rc: 0,
                sp: 'RevE',
                tp: 'consumer',
            });
        });
    });

    describe('disconnect', () => {
        it('should disconnect from gatt', async () => {
            const client = new MuseClient();
            await client.connect();

            jest.spyOn(museDevice.gatt, 'disconnect');
            client.disconnect();
            expect(museDevice.gatt.disconnect).toHaveBeenCalled();
        });

        it('should emit a disconnect event', async () => {
            const client = new MuseClient();
            let lastStatus = null;
            client.connectionStatus.subscribe((value) => {
                lastStatus = value;
            });
            await client.connect();
            expect(lastStatus).toBe(true);
            client.disconnect();
            expect(lastStatus).toBe(false);
        });

        it('should silently return if connect() was not valled', async () => {
            const client = new MuseClient();
            client.disconnect();
        });
    });

    describe('eventMarkers', () => {
        it('should emit a marker whenever injectMarker is called', async () => {
            const client = new MuseClient();
            await client.connect();

            const markers = [];
            client.eventMarkers.subscribe((eventMarker) => {
                markers.push(eventMarker);
            });

            await client.injectMarker('face', 1532808289990);
            await client.injectMarker('house', 1532808281390);
            await client.injectMarker('face', 1532808282390);
            await client.injectMarker('house', 1532808285390);

            expect(markers.length).toBe(4);
            expect(markers[markers.length - 1]).toEqual({ value: 'house', timestamp: 1532808285390 });
        });

        it('should be able to timestamp on its own', async () => {
            const client = new MuseClient();
            await client.connect();

            const markers = [];
            client.eventMarkers.subscribe((eventMarker) => {
                markers.push(eventMarker);
            });

            const startTime = new Date().getTime();
            await client.injectMarker('house');
            await client.injectMarker('face');
            await client.injectMarker('house');
            await client.injectMarker('face');

            expect(markers.length).toBe(4);
            const lastMarker = markers[markers.length - 1];
            expect(lastMarker.timestamp).toBeGreaterThanOrEqual(startTime);
            expect(lastMarker.timestamp).toBeLessThanOrEqual(new Date().getTime());
        });
    });
});
