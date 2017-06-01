import { Observable } from 'rxjs/Observable';

import 'rxjs/add/observable/fromEvent';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/takeUntil';

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
	const disconnected = Observable.fromEvent(characteristic.service!.device, 'gattserverdisconnected');
	return Observable.fromEvent(characteristic, 'characteristicvaluechanged')
		.takeUntil(disconnected)
		.map((event: Event) => (event.target as BluetoothRemoteGATTCharacteristic).value as DataView);
}
