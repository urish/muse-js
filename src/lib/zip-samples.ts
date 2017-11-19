import { Observable } from 'rxjs/Observable';
import { EEG_FREQUENCY } from './../muse';
import { EEGReading } from './muse-interfaces';

import 'rxjs/add/observable/from';
import 'rxjs/add/operator/concat';
import 'rxjs/add/operator/mergeMap';

export interface EEGSample {
    index: number;
    timestamp: number; // milliseconds since epoch
    data: number[];
}

export function zipSamples(eegReadings: Observable<EEGReading>): Observable<EEGSample> {
    const buffer: EEGReading[] = [];
    let lastTimestamp: number | null = null;
    return eegReadings
        .mergeMap<EEGReading, EEGReading[]>((reading) => {
            if (reading.timestamp !== lastTimestamp) {
                lastTimestamp = reading.timestamp;
                if (buffer.length) {
                    const result = Observable.from([[...buffer]]);
                    buffer.splice(0, buffer.length, reading);
                    return result;
                }
            }
            buffer.push(reading);
            return Observable.from([]);
        })
        .concat(Observable.from([buffer]))
        .mergeMap((readings: EEGReading[]) => {
            const result = readings[0].samples.map((x, index) => {
                const data = [NaN, NaN, NaN, NaN, NaN];
                for (const reading of readings) {
                    data[reading.electrode] = reading.samples[index];
                }
                return {
                    data,
                    index: readings[0].index,
                    timestamp: readings[0].timestamp + index * 1000. / EEG_FREQUENCY,
                };
            });
            return Observable.from(result);
        });
}
