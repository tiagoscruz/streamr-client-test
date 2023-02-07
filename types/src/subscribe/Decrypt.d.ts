import { StreamMessage } from '@streamr/protocol';
import { StreamRegistryCached } from '../registry/StreamRegistryCached';
import { DestroySignal } from '../DestroySignal';
import { SubscriberKeyExchange } from '../encryption/SubscriberKeyExchange';
import { GroupKeyStore } from '../encryption/GroupKeyStore';
import { StrictStreamrClientConfig } from '../Config';
import { StreamrClientEventEmitter } from '../events';
import { LoggerFactory } from '../utils/LoggerFactory';
export declare class Decrypt {
    private groupKeyStore;
    private keyExchange;
    private streamRegistryCached;
    private destroySignal;
    private eventEmitter;
    private config;
    private readonly logger;
    constructor(groupKeyStore: GroupKeyStore, keyExchange: SubscriberKeyExchange, streamRegistryCached: StreamRegistryCached, destroySignal: DestroySignal, loggerFactory: LoggerFactory, eventEmitter: StreamrClientEventEmitter, config: Pick<StrictStreamrClientConfig, 'decryption'>);
    decrypt(streamMessage: StreamMessage): Promise<StreamMessage>;
}
