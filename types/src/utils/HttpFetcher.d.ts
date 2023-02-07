import { StrictStreamrClientConfig } from '../Config';
import { Response } from 'node-fetch';
import { LoggerFactory } from './LoggerFactory';
export declare class HttpFetcher {
    private config;
    private readonly logger;
    constructor(loggerFactory: LoggerFactory, config: Pick<StrictStreamrClientConfig, '_timeouts'>);
    fetch(url: string, init?: Record<string, unknown>): Promise<Response>;
}
