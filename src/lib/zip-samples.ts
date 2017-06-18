import { Observable } from 'rxjs/Observable';
import { EEGReading } from './muse-interfaces';

import 'rxjs/add/observable/from';
import 'rxjs/add/operator/mergeMap';
import 'rxjs/add/operator/concat';

export interface EEGSample {
    timestamp: number;
    channelData: number[];
};

export function zipSamples(eegReadings: Observable<EEGReading>): Observable<EEGSample> {
    const buffer: EEGReading[] = [];
    let lastTimestamp: number | null = null;
    return eegReadings
        .mergeMap<EEGReading, EEGReading[]>(reading => {
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
                const channelData = [NaN, NaN, NaN, NaN, NaN];
                for (let reading of readings) {
                    channelData[reading.electrode] = reading.samples[index];
                }
                return {
                    timestamp: readings[0].timestamp,
                    channelData
                };
            });
            return Observable.from(result);
        });
}
