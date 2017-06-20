import { Observable } from 'rxjs/Observable';

import 'rxjs/add/observable/fromEvent';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/takeUntil';
import 'rxjs/add/operator/share';

export function decodeResponse(bytes: Uint8Array) {
	return new TextDecoder().decode(bytes.subarray(1, 1 + bytes[0]));
}

export function encodeCommand(cmd: string) {
	const encoded = new TextEncoder('utf-8').encode(`X${cmd}\n`);
	encoded[0] = encoded.length - 1;
	return encoded;
}

export function observableCharacteristic(characteristic: BluetoothRemoteGATTCharacteristic) {
	const disconnected = Observable.fromEvent(characteristic.service!.device, 'gattserverdisconnected');
	return new Observable<DataView>(observer => {
		characteristic.startNotifications().catch(err => observer.error(err));
		const subscription = Observable.fromEvent(characteristic, 'characteristicvaluechanged')
			.map((event: Event) => characteristic.value as DataView)
			.subscribe(observer);
		return () => {
			subscription.unsubscribe();
			characteristic.stopNotifications();
		};
	});
}
