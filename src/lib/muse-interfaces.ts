export interface EEGReading {
    electrode: number; // 0 to 4 
    timestamp: number;
    samples: number[]; // 12 samples each time
}

export interface TelemetryData {
    sequenceId: number;
    batteryLevel: number;
    fuelGaugeVoltage: number;
    temperature: number;
};

export interface XYZ {
    x: number;
    y: number;
    z: number;
};

export interface AccelerometerData {
    sequenceId: number;
    samples: XYZ[];
};

export interface MuseControlResponse {
    rc: number;
    [key: string]: string | number;
}

export interface MuseDeviceInfo extends MuseControlResponse {
    ap: string;
    bl: string;
    bn: number;
    fw: string;
    hw: string;
    pv: number;
    sp: string;
    tp: string;
}

export type GyroscopeData = AccelerometerData;
