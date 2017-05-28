import { MuseClient } from './../lib/muse';

(window as any).connect = () => {
    let client = new MuseClient();
    client.connect()
        .then(() => {
            console.log('Connected!');
        })
        .catch((err) => {
            console.error('Connection failed', err);
        });
}
