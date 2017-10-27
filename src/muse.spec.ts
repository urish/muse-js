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

    it('should connect to EEG headset', async () => {
        const client = new MuseClient();
        await client.connect();
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
        })
    });
});