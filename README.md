# muse-js

[![Build Status](https://travis-ci.org/urish/muse-js.png?branch=master)](https://travis-ci.org/urish/muse-js)

Muse 2016 EEG Headset JavaScript Library (using Web Bluetooth)

## Running the demo app

    yarn
    yarn start

and then open http://localhost:4445/

## Usage example

```typescript

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

## Auxiliary Electrode

The Muse 2016 EEG headsets contains four electrodes, and you can connect an additional Auxiliary electrode through the Micro USB port. By default, muse-js does not read data from the Auxiliary electrode channel. You can change this behavior and enable the Auxiliary electrode by setting the `enableAux` property to `true`, just before calling the `connect` method:

```typescript
async function main() {
  let client = new MuseClient();
  client.enableAux = true;
  await client.connect();
}
```
