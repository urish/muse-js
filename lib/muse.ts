import { encodeCommand, decodeResponse } from './muse-utils';

const MUSE_SERVICE = 0xfe8d;
const CONTROL_CHARACTERISTIC = '273e0001-4c4d-454d-96be-f03bac821358';

export class MuseClient {
    private controlChar: BluetoothRemoteGATTCharacteristic;

    async connect() {
        const device = await navigator.bluetooth.requestDevice({
            filters: [{ services: [MUSE_SERVICE] }]
        });
        const gatt = await device.gatt!.connect();
        const service = await gatt.getPrimaryService(MUSE_SERVICE);
        this.controlChar = await service.getCharacteristic(CONTROL_CHARACTERISTIC);
        this.controlChar.addEventListener('characteristicvaluechanged', () => {
            console.log(decodeResponse(new Uint8Array(this.controlChar.value.buffer)));
        });
        await this.controlChar.startNotifications();
        await this.controlChar.writeValue(encodeCommand('v1'));
        console.log('Connected, Hooray !');
    }
}
