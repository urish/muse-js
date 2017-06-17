import { MuseClient, EEGReading } from './../../src/lib/muse';

(window as any).connect = async () => {
    let canvases = Array.from(document.querySelectorAll('canvas'));
    let canvasCtx = canvases.map(canvas => canvas.getContext('2d'));

    function plot(reading: EEGReading) {
        const canvas = canvases[reading.electrode];
        const context = canvasCtx[reading.electrode];
        if (!context) {
            return;
        }
        const width = canvas.width / 12.0;
        const height = canvas.height / 2.0;
        context.fillStyle = 'green';
        context.clearRect(0, 0, canvas.width, canvas.height);

        for (let i = 0; i < reading.samples.length; i++) {
            const sample = reading.samples[i] / 15.;
            if (sample > 0) {
                context.fillRect(i * 25, height - sample, width, sample);
            } else {
                context.fillRect(i * 25, height, width, -sample);
            }
        }
    }

    let client = new MuseClient();
    client.connectionStatus.subscribe(status => {
        console.log(status ? 'Connected!' : 'Disconnected')
    });

    try {
        await client.connect();
        await client.start();
        client.controlResponses.subscribe(response => {
            if (response.hn) {
                document.getElementById('headset-name')!.innerText = response.hn as string;
            }
            if (response.hw) {
                document.getElementById('hardware-version')!.innerText = response.hw as string;
            }
            if (response.fw) {
                document.getElementById('firmware-version')!.innerText = response.fw as string;
            }
            console.log('control response:', response);
        })
        client.eegReadings.subscribe(reading => {
            plot(reading);
        });
        client.telemetryData.subscribe(reading => {
            document.getElementById('temperature')!.innerText = reading.temperature.toString() + '℃';
            document.getElementById('batteryLevel')!.innerText = reading.batteryLevel.toFixed(2) + '%';
        });
        client.accelerometerData.subscribe(accel => {
            const normalize = (v: number) => (v / 16384.).toFixed(2) + 'g';
            document.getElementById('accelerometer-x')!.innerText = normalize(accel.samples[2].x);
            document.getElementById('accelerometer-y')!.innerText = normalize(accel.samples[2].y);
            document.getElementById('accelerometer-z')!.innerText = normalize(accel.samples[2].z);
        });
    } catch (err) {
        console.error('Connection failed', err);
    }
};
