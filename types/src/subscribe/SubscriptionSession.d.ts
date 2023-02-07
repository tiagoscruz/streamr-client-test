import { StreamMessage, StreamPartID } from '@streamr/protocol';
import { Signal } from '../utils/Signal';
import { Subscription } from './Subscription';
import { NetworkNodeFacade } from '../NetworkNodeFacade';
import { Resends } from './Resends';
import { GroupKeyStore } from '../encryption/GroupKeyStore';
import { SubscriberKeyExchange } from '../encryption/SubscriberKeyExchange';
import { StreamRegistryCached } from '../registry/StreamRegistryCached';
import { StreamrClientEventEmitter } from '../events';
import { DestroySignal } from '../DestroySignal';
import { StrictStreamrClientConfig } from '../Config';
import { LoggerFactory } from '../utils/LoggerFactory';
/**
 * Manages adding & removing subscriptions to node as needed.
 * A session contains one or more subscriptions to a single streamId + streamPartition pair.
 */
export declare class SubscriptionSession {
    readonly streamPartId: StreamPartID;
    readonly onRetired: Signal<[]>;
    private isRetired;
    private isStopped;
    private readonly subscriptions;
    private readonly pendingRemoval;
    private readonly pipeline;
    private readonly node;
    constructor(streamPartId: StreamPartID, resends: Resends, groupKeyStore: GroupKeyStore, subscriberKeyExchange: SubscriberKeyExchange, streamRegistryCached: StreamRegistryCached, node: NetworkNodeFacade, streamrClientEventEmitter: StreamrClientEventEmitter, destroySignal: DestroySignal, loggerFactory: LoggerFactory, config: StrictStreamrClientConfig);
    private retire;
    private onError;
    distributeMessage(src: AsyncGenerator<StreamMessage>): AsyncGenerator<StreamMessage, void, unknown>;
    private onMessageInput;
    private subscribe;
    private unsubscribe;
    updateNodeSubscriptions: (() => Promise<void>) & {
        readonly activeCount: number;
        readonly pendingCount: number;
        next: () => Promise<void>;
        isActive: () => boolean;
        getCurrentStep(): Promise<void>;
        setError(err: Error): void;
        getError(): Error | undefined;
        clearError(): Error | undefined;
    };
    updateSubscriptions(): Promise<void>;
    shouldBeSubscribed(): boolean;
    stop(): Promise<void>;
    has(sub: Subscription): boolean;
    /**
     * Add subscription & appropriate connection handle.
     */
    add(sub: Subscription): Promise<void>;
    /**
     * Remove subscription & appropriate connection handle.
     */
    remove(sub: Subscription): Promise<void>;
    /**
     * How many subscriptions
     */
    count(): number;
}
