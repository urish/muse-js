import { EEGReading, TelemetryData, AccelerometerData, GyroscopeData } from './muse-interfaces';

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

export function parseTelemetry(data: DataView): TelemetryData {
    return {
        sequenceId: data.getUint16(0),
        batteryLevel: data.getUint16(2) / 512.,
        fuelGaugeVoltage: data.getUint16(4) * 2.2,
        // Next 2 bytes are probably ADC millivolt level, not sure
        temperature: data.getUint16(8),
    };
}

export function parseAccelerometer(data: DataView): AccelerometerData {
    function sample(startIndex: number) {
        return {
            x: data.getInt16(startIndex),
            y: data.getInt16(startIndex + 2),
            z: data.getInt16(startIndex + 4),
        };
    }
    return {
        sequenceId: data.getUint16(0),
        samples: [sample(2), sample(8), sample(14)]
    };
}

export function parseGyroscope(data: DataView): GyroscopeData {
    return parseAccelerometer(data);
}