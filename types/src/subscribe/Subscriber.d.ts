import { SubscriptionSession } from './SubscriptionSession';
import { Subscription } from './Subscription';
import { StreamPartID } from '@streamr/protocol';
import { StreamIDBuilder } from '../StreamIDBuilder';
import { StreamDefinition } from '../types';
import { Resends } from './Resends';
import { GroupKeyStore } from '../encryption/GroupKeyStore';
import { SubscriberKeyExchange } from '../encryption/SubscriberKeyExchange';
import { NetworkNodeFacade } from '../NetworkNodeFacade';
import { StreamrClientEventEmitter } from '../events';
import { DestroySignal } from '../DestroySignal';
import { StrictStreamrClientConfig } from '../Config';
import { StreamRegistryCached } from '../registry/StreamRegistryCached';
import { LoggerFactory } from '../utils/LoggerFactory';
export declare class Subscriber {
    private readonly subSessions;
    private readonly streamIdBuilder;
    private readonly resends;
    private readonly groupKeyStore;
    private readonly subscriberKeyExchange;
    private readonly streamRegistryCached;
    private readonly node;
    private readonly streamrClientEventEmitter;
    private readonly destroySignal;
    private readonly config;
    private readonly loggerFactory;
    private readonly logger;
    constructor(streamIdBuilder: StreamIDBuilder, resends: Resends, groupKeyStore: GroupKeyStore, subscriberKeyExchange: SubscriberKeyExchange, streamRegistryCached: StreamRegistryCached, node: NetworkNodeFacade, streamrClientEventEmitter: StreamrClientEventEmitter, destroySignal: DestroySignal, config: StrictStreamrClientConfig, loggerFactory: LoggerFactory);
    getOrCreateSubscriptionSession(streamPartId: StreamPartID): SubscriptionSession;
    add(sub: Subscription): Promise<void>;
    private remove;
    unsubscribe(streamDefinitionOrSubscription?: StreamDefinition | Subscription): Promise<unknown>;
    /**
     * Remove all subscriptions, optionally only those matching options.
     */
    private removeAll;
    /**
     * Count all subscriptions.
     */
    countAll(): number;
    /**
     * Count all matching subscriptions.
     */
    count(streamDefinition?: StreamDefinition): Promise<number>;
    /**
     * Get all subscriptions.
     */
    private getAllSubscriptions;
    /**
     * Get subscription session for matching sub options.
     */
    getSubscriptionSession(streamPartId: StreamPartID): SubscriptionSession | undefined;
    countSubscriptionSessions(): number;
    getSubscriptions(streamDefinition?: StreamDefinition): Promise<Subscription[]>;
}
