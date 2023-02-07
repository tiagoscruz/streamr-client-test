import { NetworkNodeOptions } from '@streamr/network-node';
import { MetricsContext } from '@streamr/utils';
import { StrictStreamrClientConfig } from './Config';
import { StreamMessage, StreamPartID, ProxyDirection } from '@streamr/protocol';
import { DestroySignal } from './DestroySignal';
import { Authentication } from './Authentication';
/** @deprecated This in an internal interface */
export interface NetworkNodeStub {
    getNodeId: () => string;
    addMessageListener: (listener: (msg: StreamMessage) => void) => void;
    removeMessageListener: (listener: (msg: StreamMessage) => void) => void;
    subscribe: (streamPartId: StreamPartID) => void;
    subscribeAndWaitForJoin: (streamPart: StreamPartID, timeout?: number) => Promise<number>;
    waitForJoinAndPublish: (msg: StreamMessage, timeout?: number) => Promise<number>;
    unsubscribe: (streamPartId: StreamPartID) => void;
    publish: (streamMessage: StreamMessage) => void;
    getStreamParts: () => Iterable<StreamPartID>;
    getNeighbors: () => ReadonlyArray<string>;
    getNeighborsForStreamPart: (streamPartId: StreamPartID) => ReadonlyArray<string>;
    getRtt: (nodeId: string) => number | undefined;
    setExtraMetadata: (metadata: Record<string, unknown>) => void;
    getMetricsContext: () => MetricsContext;
    hasStreamPart: (streamPartId: StreamPartID) => boolean;
    hasProxyConnection: (streamPartId: StreamPartID, contactNodeId: string, direction: ProxyDirection) => boolean;
}
export declare const getEthereumAddressFromNodeId: (nodeId: string) => string;
export interface Events {
    start: () => void;
}
/**
 * The factory is used so that integration tests can replace the real network node with a fake instance
 */
export declare class NetworkNodeFactory {
    createNetworkNode(opts: NetworkNodeOptions): NetworkNodeStub;
}
/**
 * Wrap a network node.
 * Lazily creates & starts node on first call to getNode().
 */
export declare class NetworkNodeFacade {
    private destroySignal;
    private networkNodeFactory;
    private authentication;
    private cachedNode?;
    private startNodeCalled;
    private startNodeComplete;
    private readonly config;
    private readonly eventEmitter;
    constructor(destroySignal: DestroySignal, networkNodeFactory: NetworkNodeFactory, authentication: Authentication, config: Pick<StrictStreamrClientConfig, 'network' | 'contracts'>);
    private assertNotDestroyed;
    private getNetworkOptions;
    private initNode;
    private generateId;
    /**
     * Stop network node, or wait for it to stop if already stopping.
     * Subsequent calls to getNode/start will fail.
     */
    private destroy;
    /**
     * Start network node, or wait for it to start if already started.
     */
    private startNodeTask;
    startNode: () => Promise<unknown>;
    getNode: () => Promise<NetworkNodeStub>;
    getNodeId(): Promise<string>;
    /**
     * Calls publish on node after starting it.
     * Basically a wrapper around: (await getNode()).publish(…)
     * but will be sync in case that node is already started.
     * Zalgo intentional. See below.
     */
    publishToNode(streamMessage: StreamMessage): void | Promise<void>;
    openProxyConnection(streamPartId: StreamPartID, nodeId: string, direction: ProxyDirection): Promise<void>;
    closeProxyConnection(streamPartId: StreamPartID, nodeId: string, direction: ProxyDirection): Promise<void>;
    private isStarting;
    once<E extends keyof Events>(eventName: E, listener: Events[E]): void;
}
