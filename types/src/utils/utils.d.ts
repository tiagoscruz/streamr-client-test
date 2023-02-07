import { StreamID } from '@streamr/protocol';
/**
 * Generates counter-based ids.
 * Basically lodash.uniqueid but per-prefix.
 * Not universally unique.
 * Generally useful for tracking instances.
 *
 * Careful not to use too many prefixes since it needs to hold all prefixes in memory
 * e.g. don't pass new uuid as a prefix
 *
 * counterId('test') => test.0
 * counterId('test') => test.1
 */
type CounterIdType = ((prefix: string, separator?: string) => string) & {
    clear: (...args: [string] | []) => void;
};
export declare const CounterId: (rootPrefix?: string, { maxPrefixes }?: {
    maxPrefixes?: number | undefined;
}) => CounterIdType;
export declare const counterId: CounterIdType;
export interface AnyInstance {
    constructor: {
        name: string;
        prototype: null | AnyInstance;
    };
}
export declare function instanceId(instance: AnyInstance, suffix?: string): string;
export declare function getVersionString(): string;
export declare const getEndpointUrl: (baseUrl: string, ...pathParts: string[]) => string;
export declare function formStorageNodeAssignmentStreamId(clusterAddress: string): StreamID;
export declare class MaxSizedSet<T> {
    private readonly delegate;
    constructor(maxSize: number);
    add(value: T): void;
    has(value: T): boolean;
    delete(value: T): void;
}
export declare function generateClientId(): string;
export declare const formLookupKey: <K extends (string | number)[]>(...args: K) => string;
export {};
