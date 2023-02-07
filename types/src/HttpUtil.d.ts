import { Response } from 'node-fetch';
import { StreamMessage } from '@streamr/protocol';
import { LoggerFactory } from './utils/LoggerFactory';
export declare enum ErrorCode {
    NOT_FOUND = "NOT_FOUND",
    VALIDATION_ERROR = "VALIDATION_ERROR",
    UNKNOWN = "UNKNOWN"
}
export declare const DEFAULT_HEADERS: {
    'Streamr-Client': string;
};
export declare class HttpError extends Error {
    response?: Response;
    body?: any;
    code: ErrorCode;
    errorCode: ErrorCode;
    constructor(message: string, response?: Response, body?: any, errorCode?: ErrorCode);
}
export declare class ValidationError extends HttpError {
    constructor(message: string, response?: Response, body?: any);
}
export declare class NotFoundError extends HttpError {
    constructor(message: string, response?: Response, body?: any);
}
export declare class HttpUtil {
    private readonly logger;
    constructor(loggerFactory: LoggerFactory);
    fetchHttpStream(url: string, abortController?: AbortController): AsyncIterable<StreamMessage>;
    createQueryString(query: Record<string, any>): string;
}
