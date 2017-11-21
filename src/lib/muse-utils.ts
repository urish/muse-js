import { Observable } from 'rxjs/Observable';

import { fromEvent } from 'rxjs/observable/fromEvent';
import { map } from 'rxjs/operators/map';
import { takeUntil } from 'rxjs/operators/takeUntil';

export function decodeResponse(bytes: Uint8Array) {
    return new TextDecoder().decode(bytes.subarray(1, 1 + bytes[0]));
}

export function encodeCommand(cmd: string) {
    const encoded = new TextEncoder('utf-8').encode(`X${cmd}\n`);
    encoded[0] = encoded.length - 1;
    return encoded;
}

export async function observableCharacteristic(characteristic: BluetoothRemoteGATTCharacteristic) {
    await characteristic.startNotifications();
    const disconnected = fromEvent(characteristic.service!.device, 'gattserverdisconnected');
    return fromEvent(characteristic, 'characteristicvaluechanged').pipe(
        takeUntil(disconnected),
        map((event: Event) => (event.target as BluetoothRemoteGATTCharacteristic).value as DataView),
    );
}
