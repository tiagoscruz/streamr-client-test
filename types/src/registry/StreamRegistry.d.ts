import { StrictStreamrClientConfig } from '../Config';
import { Stream, StreamMetadata } from '../Stream';
import { StreamID } from '@streamr/protocol';
import { StreamIDBuilder } from '../StreamIDBuilder';
import { SynchronizedGraphQLClient } from '../utils/SynchronizedGraphQLClient';
import { SearchStreamsPermissionFilter } from './searchStreams';
import { PermissionAssignment, PermissionQuery } from '../permission';
import { StreamRegistryCached } from './StreamRegistryCached';
import { Authentication } from '../Authentication';
import { ContractFactory } from '../ContractFactory';
import { EthereumAddress } from '@streamr/utils';
import { LoggerFactory } from '../utils/LoggerFactory';
import { StreamFactory } from './../StreamFactory';
export interface StreamQueryResult {
    id: string;
    metadata: string;
}
export declare class StreamRegistry {
    private contractFactory;
    private streamIdBuilder;
    private streamFactory;
    private graphQLClient;
    private streamRegistryCached;
    private authentication;
    private config;
    private readonly logger;
    private streamRegistryContract?;
    private streamRegistryContractsReadonly;
    constructor(contractFactory: ContractFactory, loggerFactory: LoggerFactory, streamIdBuilder: StreamIDBuilder, streamFactory: StreamFactory, graphQLClient: SynchronizedGraphQLClient, streamRegistryCached: StreamRegistryCached, authentication: Authentication, config: Pick<StrictStreamrClientConfig, 'contracts' | '_timeouts'>);
    private parseStream;
    private connectToContract;
    createStream(streamId: StreamID, metadata: StreamMetadata): Promise<Stream>;
    private ensureStreamIdInNamespaceOfAuthenticatedUser;
    updateStream(streamId: StreamID, metadata: Partial<StreamMetadata>): Promise<Stream>;
    deleteStream(streamIdOrPath: string): Promise<void>;
    private streamExistsOnChain;
    getStream(streamIdOrPath: string): Promise<Stream>;
    searchStreams(term: string | undefined, permissionFilter: SearchStreamsPermissionFilter | undefined): AsyncIterable<Stream>;
    getStreamPublishers(streamIdOrPath: string): AsyncIterable<EthereumAddress>;
    getStreamSubscribers(streamIdOrPath: string): AsyncIterable<EthereumAddress>;
    private getStreamPublishersOrSubscribersList;
    private static buildStreamPublishersOrSubscribersQuery;
    hasPermission(query: PermissionQuery): Promise<boolean>;
    getPermissions(streamIdOrPath: string): Promise<PermissionAssignment[]>;
    grantPermissions(streamIdOrPath: string, ...assignments: PermissionAssignment[]): Promise<void>;
    revokePermissions(streamIdOrPath: string, ...assignments: PermissionAssignment[]): Promise<void>;
    private updatePermissions;
    setPermissions(...items: {
        streamId: string;
        assignments: PermissionAssignment[];
    }[]): Promise<void>;
    isStreamPublisher(streamIdOrPath: string, userAddress: EthereumAddress): Promise<boolean>;
    isStreamSubscriber(streamIdOrPath: string, userAddress: EthereumAddress): Promise<boolean>;
    private queryAllReadonlyContracts;
}
