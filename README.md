# muse-js

[![Build Status](https://travis-ci.org/urish/muse-js.png?branch=master)](https://travis-ci.org/urish/muse-js)

Muse 1, Muse 2, and Muse S EEG Headset JavaScript Library (using Web Bluetooth).

## Running the demo app

    yarn
    yarn start

and then open http://localhost:4445/

## Usage example

```javascript

import { MuseClient } from 'muse-js';

async function main() {
  let client = new MuseClient();
  await client.connect();
  await client.start();
  client.eegReadings.subscribe(reading => {
    console.log(reading);
  });
  client.telemetryData.subscribe(telemetry => {
    console.log(telemetry);
  });
  client.accelerometerData.subscribe(acceleration => {
    console.log(acceleration);
  });
}

main();
```

## Using in node.js

You can use this library to connect to the Muse EEG headset from your node.js application.
Use the [bleat](https://github.com/thegecko/bleat) package which emulates the Web Bluetooth API on top of [noble](https://github.com/sandeepmistry/noble):

```javascript
const noble = require('noble');
const bluetooth = require('bleat').webbluetooth;

async function connect() {
    let device = await bluetooth.requestDevice({
        filters: [{ services: [MUSE_SERVICE] }]
    });
    const gatt = await device.gatt.connect();
    const client = new MuseClient();
    await client.connect(gatt);
    await client.start();
    // Now do whatever with muse client...
}

noble.on('stateChange', (state) => {
    if (state === 'poweredOn') {
        connect();
    }
});
```

You can find a fully working example in the [muse-lsl repo](https://github.com/urish/muse-lsl/blob/master/index.js).

## Auxiliary Electrode

The Muse 2016 EEG headsets contains four electrodes, and you can connect an additional Auxiliary electrode through the Micro USB port. By default, muse-js does not read data from the Auxiliary electrode channel. You can change this behavior and enable the Auxiliary electrode by setting the `enableAux` property to `true`, just before calling the `connect` method:

```javascript
async function main() {
  let client = new MuseClient();
  client.enableAux = true;
  await client.connect();
}
```

## PPG (Photoplethysmography) / Optical Sensor

The Muse 2 and Muse S contain PPG/optical blood sensors, which this library supports. There are three signal streams, ppg1, ppg2, and ppg3. These are ambient, infrared, and red (respectively) on the Muse 2, and (we think, unconfirmed) infrared, green, and unknown (respectively) on the Muse S. To use PPG, ensure you enable it before connecting to a Muse. PPG is not present and thus will not work on Muse 1/1.5, and enabling it may have unexpected consequences.  

To enable PPG:

```javascript
async function main() {
  let client = new MuseClient();
  client.enablePpg = true;
  await client.connect();
}
```

To subscribe and receive values from PPG, it's just like subscribing to EEG (see **Usage Example**):

```javascript
client.ppgReadings.subscribe((ppgreading) => {
    console.log(ppgreading);
});
```

## Event Markers

For convenience, there is an `eventMarkers` stream included in `MuseClient` that you can use in order to introduce timestamped event markers into your project. Just subscribe to `eventMarkers` and use the `injectMarker` method with the value and optional timestamp of an event to send it through the stream.

```javascript
async function main() {
    let client = new MuseClient();
    client.eventMarkers.subscribe((event) => {
        console.log(event);
    });
    client.injectMarker("house")
    client.injectMarker("face")
    client.injectMarker("dog")
}
```

## Projects using muse-js

* [EEGEdu](https://eegedu.com/) - Interactive Brain Playground. [Source code](https://github.com/kylemath/EEGEdu) using React, Polaris and chartjs.
* [EEG Explorer](https://muse-eeg-app.web.app/) - Visual EEG readings from the Muse EEG Headset. [Source code](https://github.com/urish/eeg-explorer) using Angular, Material Design and smoothie charts.
