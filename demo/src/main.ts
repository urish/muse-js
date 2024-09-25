// tslint:disable:no-console
import * as Papa from 'papaparse';
import { channelNames, EEGReading, MuseClient } from './../../src/muse';

(window as any).connect = async () => {
    let readings: EEGReading[] = [];
    const graphTitles = Array.from(document.querySelectorAll('.electrode-item h3'));
    const canvases = Array.from(document.querySelectorAll('.electrode-item canvas')) as HTMLCanvasElement[];
    const canvasCtx = canvases.map((canvas) => canvas.getContext('2d'));

    graphTitles.forEach((item, index) => {
        item.textContent = channelNames[index];
    });

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
            const sample = reading.samples[i] / 15;
            if (sample > 0) {
                context.fillRect(i * 25, height - sample, width, sample);
            } else {
                context.fillRect(i * 25, height, width, -sample);
            }
        }
    }

    const client = new MuseClient();
    client.connectionStatus.subscribe((status) => {
        console.log(status ? 'Connected!' : 'Disconnected');
    });

    try {
        document.getElementById('save-and-flush')!.onclick = () => {
            // Prepare data for CSV
            const csvData: any[] = [];
            readings.forEach((reading) => {
                reading.samples.forEach((sample, sampleIndex) => {
                    csvData.push({
                        index: reading.index,
                        electrode: channelNames[reading.electrode],
                        timestamp: reading.timestamp,
                        sampleIndex,
                        value: sample,
                    });
                });
            });

            // Convert to CSV
            const csv = Papa.unparse(csvData);
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            if (link.download !== undefined) {
                const url = URL.createObjectURL(blob);
                link.setAttribute('href', url);
                link.setAttribute('download', `muse_eeg_data_${new Date().toISOString()}.csv`);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }

            // Clear the readings array
            readings = [];
            console.log('Data saved to CSV and readings array cleared.');
        };

        client.enableAux = true;
        await client.connect();
        await client.start();
        document.getElementById('headset-name')!.innerText = client.deviceName;
        client.eegReadings.subscribe((reading) => {
            plot(reading);
            console.log(reading);
            readings.push(reading);
        });
        client.telemetryData.subscribe((reading) => {
            document.getElementById('temperature')!.innerText = reading.temperature.toString() + '℃';
            document.getElementById('batteryLevel')!.innerText = reading.batteryLevel.toFixed(2) + '%';
        });
        client.accelerometerData.subscribe((accel) => {
            const normalize = (v: number) => (v / 16384).toFixed(2) + 'g';
            document.getElementById('accelerometer-x')!.innerText = normalize(accel.samples[2].x);
            document.getElementById('accelerometer-y')!.innerText = normalize(accel.samples[2].y);
            document.getElementById('accelerometer-z')!.innerText = normalize(accel.samples[2].z);
        });
        await client.deviceInfo().then((deviceInfo) => {
            console.log(deviceInfo);
            document.getElementById('hardware-version')!.innerText = deviceInfo.hw;
            document.getElementById('firmware-version')!.innerText = deviceInfo.fw;
        });
    } catch (err) {
        console.error('Connection failed', err);
    }
};
