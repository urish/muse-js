import { encodeCommand, decodeResponse, observableCharacteristic, decodeEEGSamples } from './muse-utils';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/merge';

const MUSE_SERVICE = 0xfe8d;
const CONTROL_CHARACTERISTIC = '273e0001-4c4d-454d-96be-f03bac821358';
const EEG_CHARACTERISTICS = [
    '273e0003-4c4d-454d-96be-f03bac821358',
    '273e0004-4c4d-454d-96be-f03bac821358',
    '273e0005-4c4d-454d-96be-f03bac821358',
    '273e0006-4c4d-454d-96be-f03bac821358',
    '273e0007-4c4d-454d-96be-f03bac821358'
]

export interface EEGReading {
    electrode: number; // 0 to 4 
    timestamp: number;
    samples: number[]; // 12 samples each time
}

export class MuseClient {
    private controlChar: BluetoothRemoteGATTCharacteristic;
    private eegCharacteristics: BluetoothRemoteGATTCharacteristic[];

    public eegReadings: Observable<EEGReading>;

    async connect() {
        const device = await navigator.bluetooth.requestDevice({
            filters: [{ services: [MUSE_SERVICE] }]
        });
        const gatt = await device.gatt!.connect();
        const service = await gatt.getPrimaryService(MUSE_SERVICE);
        this.controlChar = await service.getCharacteristic(CONTROL_CHARACTERISTIC);
        observableCharacteristic(this.controlChar).subscribe(data => {
            console.log(decodeResponse(new Uint8Array(data.buffer)));
        });
        this.eegCharacteristics = [];
        const eegObservables = [];
        for (let index = 0; index < EEG_CHARACTERISTICS.length; index++) {
            let characteristicId = EEG_CHARACTERISTICS[index];
            const eegChar = await service.getCharacteristic(characteristicId);
            eegObservables.push(
                observableCharacteristic(eegChar).map(data => {
                    return {
                        electrode: index,
                        timestamp: data.getInt16(0),
                        samples: decodeEEGSamples(new Uint8Array(data.buffer).subarray(2))
                    };
                }));
            this.eegCharacteristics.push(eegChar);
        }
        this.eegReadings = Observable.merge(...eegObservables); 
        this.sendCommand('v1');
        console.log('Connected, Hooray !');
    }

    async sendCommand(cmd: string) {
        await this.controlChar.writeValue((encodeCommand(cmd)));
    }

    async start() {
        // Subscribe to egg characteristics
        this.pause();
        // Select preset number 20
        await this.controlChar.writeValue(encodeCommand('p20'));
        await this.controlChar.writeValue(encodeCommand('s'));
        this.resume();
    }

    async pause() {
        await this.sendCommand('h');
    }

    async resume() {
        await this.sendCommand('d');
    }
}
