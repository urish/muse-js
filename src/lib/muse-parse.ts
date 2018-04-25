import { Observable } from 'rxjs';
import { concatMap, filter, map, scan } from 'rxjs/operators';

import { AccelerometerData, EEGReading, GyroscopeData, TelemetryData } from './muse-interfaces';

export function parseControl(controlData: Observable<string>) {
    return controlData.pipe(
        concatMap((data) => data.split('')),
        scan((acc, value) => {
            if (acc.indexOf('}') >= 0) {
                return value;
            } else {
                return acc + value;
            }
        }, ''),
        filter((value) => value.indexOf('}') >= 0),
        map((value) => JSON.parse(value)),
    );
}

export function decodeUnsigned12BitData(samples: Uint8Array) {
    const samples12Bit = [];
    // tslint:disable:no-bitwise
    for (let i = 0; i < samples.length; i++) {
        if (i % 3 === 0) {
            samples12Bit.push(samples[i] << 4 | samples[i + 1] >> 4);
        } else {
            samples12Bit.push((samples[i] & 0xf) << 8 | samples[i + 1]);
            i++;
        }
    }
    // tslint:enable:no-bitwise
    return samples12Bit;
}

export function decodeEEGSamples(samples: Uint8Array) {
    return decodeUnsigned12BitData(samples)
        .map((n) => 0.48828125 * (n - 0x800));
}

export function parseTelemetry(data: DataView): TelemetryData {
    // tslint:disable:object-literal-sort-keys
    return {
        sequenceId: data.getUint16(0),
        batteryLevel: data.getUint16(2) / 512.,
        fuelGaugeVoltage: data.getUint16(4) * 2.2,
        // Next 2 bytes are probably ADC millivolt level, not sure
        temperature: data.getUint16(8),
    };
    // tslint:enable:object-literal-sort-keys
}

function parseImuReading(data: DataView, scale: number) {
    function sample(startIndex: number) {
        return {
            x: scale * data.getInt16(startIndex),
            y: scale * data.getInt16(startIndex + 2),
            z: scale * data.getInt16(startIndex + 4),
        };
    }
    // tslint:disable:object-literal-sort-keys
    return {
        sequenceId: data.getUint16(0),
        samples: [sample(2), sample(8), sample(14)],
    };
    // tslint:enable:object-literal-sort-keys
}

export function parseAccelerometer(data: DataView): AccelerometerData {
    return parseImuReading(data, 0.0000610352);
}

export function parseGyroscope(data: DataView): GyroscopeData {
    return parseImuReading(data, 0.0074768);
}
