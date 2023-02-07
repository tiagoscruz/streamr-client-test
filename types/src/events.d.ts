import EventEmitter3 from 'eventemitter3';
import { StorageNodeAssignmentEvent } from './registry/StreamStorageRegistry';
type Events<T> = {
    [K in keyof T]: (payload: any) => void;
};
export interface StreamrClientEvents {
    addToStorageNode: (payload: StorageNodeAssignmentEvent) => void;
    removeFromStorageNode: (payload: StorageNodeAssignmentEvent) => void;
}
export interface InternalEvents {
    publish: () => void;
    subscribe: () => void;
}
interface ObserverEvents<E extends Events<E>> {
    addEventListener: (eventName: keyof E) => void;
    removeEventListener: (eventName: keyof E) => void;
}
export declare class ObservableEventEmitter<E extends Events<E>> {
    private delegate;
    private observer;
    on<T extends keyof E>(eventName: T, listener: E[T]): void;
    once<T extends keyof E>(eventName: T, listener: E[T]): void;
    off<T extends keyof E>(eventName: T, listener: E[T]): void;
    removeAllListeners(): void;
    emit<T extends keyof E>(eventName: T, payload: Parameters<E[T]>[0]): void;
    getListenerCount<T extends keyof E>(eventName: T): number;
    getObserver(): EventEmitter3<ObserverEvents<E>, any>;
}
export declare const initEventGateway: <E extends Events<E>, T extends keyof E, P>(eventName: T, start: (emit: (payload: Parameters<E[T]>[0]) => void) => P, stop: (listener: P) => void, emitter: ObservableEventEmitter<E>) => void;
export declare class StreamrClientEventEmitter extends ObservableEventEmitter<StreamrClientEvents & InternalEvents> {
}
export {};
