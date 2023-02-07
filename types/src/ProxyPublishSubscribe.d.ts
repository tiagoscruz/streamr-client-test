import { StreamDefinition } from './types';
import { StreamIDBuilder } from './StreamIDBuilder';
import { NetworkNodeFacade } from './NetworkNodeFacade';
import { ProxyDirection } from '@streamr/protocol';
export declare class ProxyPublishSubscribe {
    private node;
    private streamIdBuilder;
    constructor(node: NetworkNodeFacade, streamIdBuilder: StreamIDBuilder);
    openProxyConnections(streamDefinition: StreamDefinition, nodeIds: string[], direction: ProxyDirection): Promise<void>;
    closeProxyConnections(streamDefinition: StreamDefinition, nodeIds: string[], direction: ProxyDirection): Promise<void>;
}
