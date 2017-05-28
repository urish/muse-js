export function decodeResponse(bytes: Uint8Array) {
	return new TextDecoder().decode(bytes.subarray(1, 1 + bytes[0]));
}

export function encodeCommand(cmd: string) {
	const encoded = new TextEncoder('utf-8').encode(`X${cmd}\n`);
	encoded[0] = encoded.length - 1;
	return encoded;
}
