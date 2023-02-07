import { StreamID, StreamMessage } from '@streamr/protocol';
import { StreamDefinition } from '../types';
import { StreamIDBuilder } from '../StreamIDBuilder';
import { Authentication } from '../Authentication';
import { NetworkNodeFacade } from '../NetworkNodeFacade';
import { StreamRegistryCached } from '../registry/StreamRegistryCached';
import { GroupKeyStore } from '../encryption/GroupKeyStore';
import { GroupKeyQueue } from './GroupKeyQueue';
export interface PublishMetadata {
    timestamp?: string | number | Date;
    partitionKey?: string | number;
    msgChainId?: string;
}
export declare class Publisher {
    private readonly messageFactories;
    private readonly groupKeyQueues;
    private readonly streamIdBuilder;
    private readonly authentication;
    private readonly streamRegistryCached;
    private readonly node;
    private readonly concurrencyLimit;
    constructor(streamIdBuilder: StreamIDBuilder, authentication: Authentication, streamRegistryCached: StreamRegistryCached, groupKeyStore: GroupKeyStore, node: NetworkNodeFacade);
    publish<T>(streamDefinition: StreamDefinition, content: T, metadata?: PublishMetadata): Promise<StreamMessage<T>>;
    getGroupKeyQueue(streamId: StreamID): Promise<GroupKeyQueue>;
    private createMessageFactory;
}
