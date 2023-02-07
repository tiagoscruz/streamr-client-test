export type StreamrClientErrorCode = 'MISSING_PERMISSION' | 'NO_STORAGE_NODES' | 'INVALID_ARGUMENT' | 'CLIENT_DESTROYED' | 'PIPELINE_ERROR' | 'UNKNOWN_ERROR';
export declare class StreamrClientError extends Error {
    readonly code: StreamrClientErrorCode;
    constructor(message: string, code: StreamrClientErrorCode);
}
