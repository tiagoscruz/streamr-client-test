import { StrictStreamrClientConfig } from '../Config';
import { Stream } from '../Stream';
import { StreamID } from '@streamr/protocol';
import { StreamIDBuilder } from '../StreamIDBuilder';
import { SynchronizedGraphQLClient } from '../utils/SynchronizedGraphQLClient';
import { StreamrClientEventEmitter } from '../events';
import { Authentication } from '../Authentication';
import { ContractFactory } from '../ContractFactory';
import { EthereumAddress } from '@streamr/utils';
import { LoggerFactory } from '../utils/LoggerFactory';
import { StreamFactory } from '../StreamFactory';
export interface StorageNodeAssignmentEvent {
    readonly streamId: StreamID;
    readonly nodeAddress: EthereumAddress;
    readonly blockNumber: number;
}
/**
 * Stores storage node assignments (mapping of streamIds <-> storage nodes addresses)
 */
export declare class StreamStorageRegistry {
    private contractFactory;
    private streamFactory;
    private streamIdBuilder;
    private graphQLClient;
    private authentication;
    private streamStorageRegistryContract?;
    private config;
    private readonly streamStorageRegistryContractReadonly;
    private readonly logger;
    constructor(contractFactory: ContractFactory, streamFactory: StreamFactory, streamIdBuilder: StreamIDBuilder, graphQLClient: SynchronizedGraphQLClient, eventEmitter: StreamrClientEventEmitter, authentication: Authentication, loggerFactory: LoggerFactory, config: Pick<StrictStreamrClientConfig, 'contracts'>);
    private initStreamAssignmentEventListener;
    private connectToContract;
    addStreamToStorageNode(streamIdOrPath: string, nodeAddress: EthereumAddress): Promise<void>;
    removeStreamFromStorageNode(streamIdOrPath: string, nodeAddress: EthereumAddress): Promise<void>;
    isStoredStream(streamIdOrPath: string, nodeAddress: EthereumAddress): Promise<boolean>;
    getStoredStreams(nodeAddress: EthereumAddress): Promise<{
        streams: Stream[];
        blockNumber: number;
    }>;
    getStorageNodes(streamIdOrPath?: string): Promise<EthereumAddress[]>;
}
