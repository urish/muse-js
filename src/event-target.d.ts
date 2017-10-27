declare module 'event-target-shim' {
    export class EventTarget {
        addEventListener(event: string, listener: Function): void;
        removeEventListener(event: string, listener: Function): void;
        dispatchEvent(event: Event): void;
    }
}
