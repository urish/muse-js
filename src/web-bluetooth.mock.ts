import { EventTarget } from 'event-target-shim';

export class CharacteristicMock extends EventTarget {
    value: DataView;

    constructor(public service: PrimaryServiceMock) {
        super();
    }

    startNotifications() { }

    readValue() { }

    writeValue() { }
}

export class PrimaryServiceMock {
    private characteristicMocks: { [characteristic: string]: CharacteristicMock } = {};

    constructor(public device: DeviceMock) {
    }

    getCharacteristic(characteristic: BluetoothCharacteristicUUID) {
        return Promise.resolve(this.getCharacteristicMock(characteristic));
    }

    getCharacteristicMock(characteristic: BluetoothCharacteristicUUID) {
        if (!this.characteristicMocks[characteristic]) {
            this.characteristicMocks[characteristic] = new CharacteristicMock(this);
        }
        return this.characteristicMocks[characteristic];
    }
}

export class GattMock {
    constructor(public device: DeviceMock) {
        this.device = device;
    }

    connect() {
        return Promise.resolve(this);
    }

    getPrimaryService(service: BluetoothServiceUUID) {
        return Promise.resolve(this.device.getServiceMock(service));
    }
}


export class DeviceMock extends EventTarget {
    gatt: GattMock;
    serviceMocks: { [service: string]: PrimaryServiceMock } = {};

    constructor(public name: string, private services: BluetoothServiceUUID[]) {
        super();
        this.gatt = new GattMock(this);
    }

    hasService(service: BluetoothServiceUUID) {
        return this.services && this.services.indexOf(service) >= 0;
    }

    getServiceMock(service: BluetoothServiceUUID) {
        if (!this.serviceMocks[service]) {
            this.serviceMocks[service] = new PrimaryServiceMock(this);
        }
        return this.serviceMocks[service];
    }
}

export class WebBluetoothMock {
    constructor(public devices: DeviceMock[]) {

    }

    requestDevice(options: RequestDeviceOptions) {
        for (let device of this.devices) {
            for (let filter of options.filters) {
                if (filter.name && filter.name === device.name) {
                    return Promise.resolve(device);
                }

                if (filter.namePrefix && device.name && device.name.indexOf(filter.namePrefix) === 0) {
                    return Promise.resolve(device);
                }

                if (filter.services) {
                    let found = true;
                    for (let service of filter.services) {
                        found = found && device.hasService(service);
                    }
                    if (found) {
                        return Promise.resolve(device);
                    }
                }
            }
        }
        return Promise.reject(new Error('User cancelled device chooser'));
    }
}