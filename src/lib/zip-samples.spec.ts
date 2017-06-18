import { zipSamples } from './zip-samples';
import { Observable } from 'rxjs/Observable';

import 'rxjs/add/observable/of';
import 'rxjs/add/operator/toArray';
import 'rxjs/add/operator/toPromise';

describe('zipSamples', () => {
    it('should zip all eeg channels into one array', async () => {
        const input = Observable.of(
            { timestamp: 100, electrode: 2, samples: [2.01, 2.02, 2.03, 2.04, 2.05, 2.06, 2.07, 2.08, 2.09, 2.10, 2.11, 2.12] },
            { timestamp: 100, electrode: 1, samples: [1.01, 1.02, 1.03, 1.04, 1.05, 1.06, 1.07, 1.08, 1.09, 1.10, 1.11, 1.12] },
            { timestamp: 100, electrode: 4, samples: [4.01, 4.02, 4.03, 4.04, 4.05, 4.06, 4.07, 4.08, 4.09, 4.10, 4.11, 4.12] },
            { timestamp: 100, electrode: 0, samples: [0.01, 0.02, 0.03, 0.04, 0.05, 0.06, 0.07, 0.08, 0.09, 0.10, 0.11, 0.12] },
            { timestamp: 100, electrode: 3, samples: [3.01, 3.02, 3.03, 3.04, 3.05, 3.06, 3.07, 3.08, 3.09, 3.10, 3.11, 3.12] },
            { timestamp: 101, electrode: 2, samples: [12.01, 12.02, 12.03, 12.04, 12.05, 12.06, 12.07, 12.08, 12.09, 12.10, 12.11, 12.12] },
            { timestamp: 101, electrode: 1, samples: [11.01, 11.02, 11.03, 11.04, 11.05, 11.06, 11.07, 11.08, 11.09, 11.10, 11.11, 11.12] },
            { timestamp: 101, electrode: 4, samples: [14.01, 14.02, 14.03, 14.04, 14.05, 14.06, 14.07, 14.08, 14.09, 14.10, 14.11, 14.12] },
            { timestamp: 101, electrode: 0, samples: [10.01, 10.02, 10.03, 10.04, 10.05, 10.06, 10.07, 10.08, 10.09, 10.10, 10.11, 10.12] },
            { timestamp: 101, electrode: 3, samples: [13.01, 13.02, 13.03, 13.04, 13.05, 13.06, 13.07, 13.08, 13.09, 13.10, 13.11, 13.12] },
        );
        const zipped = zipSamples(input);
        const result = await zipped.toArray().toPromise();
        expect(result).toEqual([
            { timestamp: 100, channelData: [0.01, 1.01, 2.01, 3.01, 4.01] },
            { timestamp: 100, channelData: [0.02, 1.02, 2.02, 3.02, 4.02] },
            { timestamp: 100, channelData: [0.03, 1.03, 2.03, 3.03, 4.03] },
            { timestamp: 100, channelData: [0.04, 1.04, 2.04, 3.04, 4.04] },
            { timestamp: 100, channelData: [0.05, 1.05, 2.05, 3.05, 4.05] },
            { timestamp: 100, channelData: [0.06, 1.06, 2.06, 3.06, 4.06] },
            { timestamp: 100, channelData: [0.07, 1.07, 2.07, 3.07, 4.07] },
            { timestamp: 100, channelData: [0.08, 1.08, 2.08, 3.08, 4.08] },
            { timestamp: 100, channelData: [0.09, 1.09, 2.09, 3.09, 4.09] },
            { timestamp: 100, channelData: [0.10, 1.10, 2.10, 3.10, 4.10] },
            { timestamp: 100, channelData: [0.11, 1.11, 2.11, 3.11, 4.11] },
            { timestamp: 100, channelData: [0.12, 1.12, 2.12, 3.12, 4.12] },
            { timestamp: 101, channelData: [10.01, 11.01, 12.01, 13.01, 14.01] },
            { timestamp: 101, channelData: [10.02, 11.02, 12.02, 13.02, 14.02] },
            { timestamp: 101, channelData: [10.03, 11.03, 12.03, 13.03, 14.03] },
            { timestamp: 101, channelData: [10.04, 11.04, 12.04, 13.04, 14.04] },
            { timestamp: 101, channelData: [10.05, 11.05, 12.05, 13.05, 14.05] },
            { timestamp: 101, channelData: [10.06, 11.06, 12.06, 13.06, 14.06] },
            { timestamp: 101, channelData: [10.07, 11.07, 12.07, 13.07, 14.07] },
            { timestamp: 101, channelData: [10.08, 11.08, 12.08, 13.08, 14.08] },
            { timestamp: 101, channelData: [10.09, 11.09, 12.09, 13.09, 14.09] },
            { timestamp: 101, channelData: [10.10, 11.10, 12.10, 13.10, 14.10] },
            { timestamp: 101, channelData: [10.11, 11.11, 12.11, 13.11, 14.11] },
            { timestamp: 101, channelData: [10.12, 11.12, 12.12, 13.12, 14.12] },
        ]);
    });

    it('should indicate missing samples with NaN', async () => {
        const input = Observable.of(
            { timestamp: 50, electrode: 2, samples: [2.01, 2.02, 2.03, 2.04] },
            { timestamp: 50, electrode: 4, samples: [4.01, 4.02, 4.03, 4.04] },
            { timestamp: 50, electrode: 0, samples: [0.01, 0.02, 0.03, 0.04] },
            { timestamp: 50, electrode: 3, samples: [3.01, 3.02, 3.03, 3.04] },
        );
        const zipped = zipSamples(input);
        const result = await zipped.toArray().toPromise();
        expect(result).toEqual([
            { timestamp: 50, channelData: [0.01, NaN, 2.01, 3.01, 4.01] },
            { timestamp: 50, channelData: [0.02, NaN, 2.02, 3.02, 4.02] },
            { timestamp: 50, channelData: [0.03, NaN, 2.03, 3.03, 4.03] },
            { timestamp: 50, channelData: [0.04, NaN, 2.04, 3.04, 4.04] },
        ]);
    });

});