import { MuseClient } from './../lib/muse';

(window as any).connect = async () => {
    let client = new MuseClient();
    try {
        await client.connect();
        console.log('Connected!');
        await client.start();
        client.eegReadings.subscribe(reading => {
            console.log('eeg reading', reading);
        });
    } catch (err) {
        console.error('Connection failed', err);
    }
};
