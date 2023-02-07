import { StreamPartID } from '@streamr/protocol';
import { MessageStream } from './MessageStream';
import { StorageNodeRegistry } from '../registry/StorageNodeRegistry';
import { StrictStreamrClientConfig } from '../Config';
import { HttpUtil } from '../HttpUtil';
import { StreamStorageRegistry } from '../registry/StreamStorageRegistry';
import { EthereumAddress } from '@streamr/utils';
import { GroupKeyStore } from '../encryption/GroupKeyStore';
import { SubscriberKeyExchange } from '../encryption/SubscriberKeyExchange';
import { StreamrClientEventEmitter } from '../events';
import { DestroySignal } from '../DestroySignal';
import { StreamRegistryCached } from '../registry/StreamRegistryCached';
import { LoggerFactory } from '../utils/LoggerFactory';
import { Message } from '../Message';
export interface ResendRef {
    timestamp: number | Date | string;
    sequenceNumber?: number;
}
/**
 * Resend the latest "n" messages.
 */
export interface ResendLastOptions {
    last: number;
}
/**
 * Resend messages starting from a given point in time.
 */
export interface ResendFromOptions {
    from: ResendRef;
    publisherId?: string;
}
/**
 * Resend messages between two points in time.
 */
export interface ResendRangeOptions {
    from: ResendRef;
    to: ResendRef;
    msgChainId?: string;
    publisherId?: string;
}
/**
 * The supported resend types.
 */
export type ResendOptions = ResendLastOptions | ResendFromOptions | ResendRangeOptions;
export declare class Resends {
    private streamStorageRegistry;
    private storageNodeRegistry;
    private streamRegistryCached;
    private httpUtil;
    private readonly groupKeyStore;
    private readonly subscriberKeyExchange;
    private readonly streamrClientEventEmitter;
    private readonly destroySignal;
    private readonly config;
    private readonly loggerFactory;
    private readonly logger;
    constructor(streamStorageRegistry: StreamStorageRegistry, storageNodeRegistry: StorageNodeRegistry, streamRegistryCached: StreamRegistryCached, httpUtil: HttpUtil, groupKeyStore: GroupKeyStore, subscriberKeyExchange: SubscriberKeyExchange, streamrClientEventEmitter: StreamrClientEventEmitter, destroySignal: DestroySignal, config: StrictStreamrClientConfig, loggerFactory: LoggerFactory);
    resend(streamPartId: StreamPartID, options: ResendOptions): Promise<MessageStream>;
    private fetchStream;
    last(streamPartId: StreamPartID, { count }: {
        count: number;
    }): Promise<MessageStream>;
    private from;
    range(streamPartId: StreamPartID, { fromTimestamp, fromSequenceNumber, toTimestamp, toSequenceNumber, publisherId, msgChainId }: {
        fromTimestamp: number;
        fromSequenceNumber?: number;
        toTimestamp: number;
        toSequenceNumber?: number;
        publisherId?: EthereumAddress;
        msgChainId?: string;
    }): Promise<MessageStream>;
    waitForStorage(message: Message, { interval, timeout, count, messageMatchFn }?: {
        interval?: number;
        timeout?: number;
        count?: number;
        messageMatchFn?: (msgTarget: Message, msgGot: Message) => boolean;
    }): Promise<void>;
    private createUrl;
}
