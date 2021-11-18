import { from, Observable } from 'rxjs';
import { concat, mergeMap } from 'rxjs/operators';
import { PPG_FREQUENCY } from './../muse';
import { PPGReading } from './muse-interfaces';

export interface PPGSample {
    index: number;
    timestamp: number; // milliseconds since epoch
    data: number[];
}

export function zipSamplesPpg(ppgReadings: Observable<PPGReading>): Observable<PPGSample> {
    const buffer: PPGReading[] = [];
    let lastTimestamp: number | null = null;
    return ppgReadings.pipe(
        mergeMap((reading) => {
            if (reading.timestamp !== lastTimestamp) {
                lastTimestamp = reading.timestamp;
                if (buffer.length) {
                    const result = from([[...buffer]]);
                    buffer.splice(0, buffer.length, reading);
                    return result;
                }
            }
            buffer.push(reading);
            return from([]);
        }),
        concat(from([buffer])),
        mergeMap((readings: PPGReading[]) => {
            const result = readings[0].samples.map((x, index) => {
                const data = [NaN, NaN, NaN];
                for (const reading of readings) {
                    data[reading.electrode] = reading.samples[index];
                }
                return {
                    data,
                    index: readings[0].index,
                    timestamp: readings[0].timestamp + (index * 1000) / PPG_FREQUENCY,
                };
            });
            return from(result);
        }),
    );
}
