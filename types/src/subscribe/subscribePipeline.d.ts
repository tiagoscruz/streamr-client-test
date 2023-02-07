/**
 * Subscription message processing pipeline
 */
import { StreamPartID } from '@streamr/protocol';
import { MessageStream } from './MessageStream';
import { StrictStreamrClientConfig } from '../Config';
import { Resends } from './Resends';
import { DestroySignal } from '../DestroySignal';
import { StreamRegistryCached } from '../registry/StreamRegistryCached';
import { GroupKeyStore } from '../encryption/GroupKeyStore';
import { SubscriberKeyExchange } from '../encryption/SubscriberKeyExchange';
import { StreamrClientEventEmitter } from '../events';
import { LoggerFactory } from '../utils/LoggerFactory';
export interface SubscriptionPipelineOptions {
    streamPartId: StreamPartID;
    loggerFactory: LoggerFactory;
    resends: Resends;
    groupKeyStore: GroupKeyStore;
    subscriberKeyExchange: SubscriberKeyExchange;
    streamRegistryCached: StreamRegistryCached;
    streamrClientEventEmitter: StreamrClientEventEmitter;
    destroySignal: DestroySignal;
    config: StrictStreamrClientConfig;
}
export declare const createSubscribePipeline: (opts: SubscriptionPipelineOptions) => MessageStream;
