import { StreamID } from "@streamr/protocol";
export declare const PersistenceInjectionToken: unique symbol;
export interface Persistence<K, V> {
    get(key: K, streamId: StreamID): Promise<V | undefined>;
    set(key: K, value: V, streamId: StreamID): Promise<void>;
    close(): Promise<void>;
}
