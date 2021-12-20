import { Observable, of } from 'rxjs';
import { toArray } from 'rxjs/operators';

import { zipSamplesPpg } from './zip-samplesPpg';

// tslint:disable:object-literal-sort-keys

describe('zipSamplesPpg', () => {
    it('should zip all ppg channels into one array', async () => {
        const input = of(
            {
                ppgChannel: 0,
                index: 100,
                timestamp: 1000,
                samples: [0.01, 0.02, 0.03, 0.04, 0.05, 0.06],
            },
            {
                ppgChannel: 1,
                index: 100,
                timestamp: 1000,
                samples: [1.01, 1.02, 1.03, 1.04, 1.05, 1.06],
            },
            {
                ppgChannel: 2,
                index: 100,
                timestamp: 1000,
                samples: [2.01, 2.02, 2.03, 2.04, 2.05, 2.06],
            },
            {
                ppgChannel: 0,
                index: 101,
                timestamp: 1046.875,
                samples: [10.01, 10.02, 10.03, 10.04, 10.05, 10.06],
            },
            {
                ppgChannel: 1,
                index: 101,
                timestamp: 1046.875,
                samples: [11.01, 11.02, 11.03, 11.04, 11.05, 11.06],
            },
            {
                ppgChannel: 2,
                index: 101,
                timestamp: 1046.875,
                samples: [12.01, 12.02, 12.03, 12.04, 12.05, 12.06],
            },
        );
        const zipped = zipSamplesPpg(input);
        const result = await zipped.pipe(toArray()).toPromise();
        expect(result).toEqual([
            { index: 100, timestamp: 1000.0, data: [0.01, 1.01, 2.01] },
            { index: 100, timestamp: 1015.625, data: [0.02, 1.02, 2.02] },
            { index: 100, timestamp: 1031.25, data: [0.03, 1.03, 2.03] },
            { index: 100, timestamp: 1046.875, data: [0.04, 1.04, 2.04] },
            { index: 100, timestamp: 1062.5, data: [0.05, 1.05, 2.05] },
            { index: 100, timestamp: 1078.125, data: [0.06, 1.06, 2.06] },
            { index: 101, timestamp: 1046.875, data: [10.01, 11.01, 12.01] },
            { index: 101, timestamp: 1062.5, data: [10.02, 11.02, 12.02] },
            { index: 101, timestamp: 1078.125, data: [10.03, 11.03, 12.03] },
            { index: 101, timestamp: 1093.75, data: [10.04, 11.04, 12.04] },
            { index: 101, timestamp: 1109.375, data: [10.05, 11.05, 12.05] },
            { index: 101, timestamp: 1125, data: [10.06, 11.06, 12.06] },
        ]);
    });

    it('should indicate missing samples with NaN', async () => {
        const input = of(
            { index: 50, timestamp: 5000, ppgChannel: 0, samples: [0.01, 0.02, 0.03, 0.04] },
            { index: 50, timestamp: 5000, ppgChannel: 2, samples: [2.01, 2.02, 2.03, 2.04] },
        );
        const zipped = zipSamplesPpg(input);
        const result = await zipped.pipe(toArray()).toPromise();
        expect(result).toEqual([
            { index: 50, timestamp: 5000.0, data: [0.01, NaN, 2.01] },
            { index: 50, timestamp: 5015.625, data: [0.02, NaN, 2.02] },
            { index: 50, timestamp: 5031.25, data: [0.03, NaN, 2.03] },
            { index: 50, timestamp: 5046.875, data: [0.04, NaN, 2.04] },
        ]);
    });
});
