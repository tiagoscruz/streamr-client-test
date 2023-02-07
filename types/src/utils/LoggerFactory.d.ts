/// <reference types="node" />
import { Logger } from '@streamr/utils';
import { StrictStreamrClientConfig } from '../Config';
export declare class LoggerFactory {
    private readonly config;
    constructor(config: Pick<StrictStreamrClientConfig, 'id' | 'logLevel'>);
    createLogger(module: NodeJS.Module): Logger;
}
