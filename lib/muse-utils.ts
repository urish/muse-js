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

export function observableCharacteristic(characteristic: BluetoothRemoteGATTCharacteristic) {
	characteristic.startNotifications();
	const disconnected = Observable.fromEvent(characteristic.service!.device, 'gattserverdisconnected');
	return Observable.fromEvent(characteristic, 'characteristicvaluechanged')
		.takeUntil(disconnected)
		.map((event: Event) => (event.target as BluetoothRemoteGATTCharacteristic).value as DataView);
}

export function decodeSigned12BitData(samples: Uint8Array) {
	const samples12Bit = [];
	for (let i = 0; i < samples.length; i++) {
		if (i % 3 === 0) {
			samples12Bit.push(samples[i] << 4 | samples[i + 1] >> 4);
		} else {
			samples12Bit.push((samples[i] & 0xf) << 8 | samples[i + 1]);
			i++;
		}
	}
	return samples12Bit.map(n => {
		return (n & 0x800) ? (n - 0x1000) : n;
	});
}

export function decodeEEGSamples(samples: Uint8Array) {
	return decodeSigned12BitData(samples)
		.map(n => 0.48828125 * n);
}
