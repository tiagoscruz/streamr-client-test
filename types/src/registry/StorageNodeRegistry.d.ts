import { StrictStreamrClientConfig } from '../Config';
import { Authentication } from '../Authentication';
import { ContractFactory } from '../ContractFactory';
import { EthereumAddress } from '@streamr/utils';
export interface StorageNodeMetadata {
    http: string;
}
/**
 * Store a mapping of storage node addresses <-> storage node URLs
 */
export declare class StorageNodeRegistry {
    private contractFactory;
    private authentication;
    private config;
    private nodeRegistryContract?;
    private readonly nodeRegistryContractReadonly;
    constructor(contractFactory: ContractFactory, authentication: Authentication, config: Pick<StrictStreamrClientConfig, 'contracts'>);
    private connectToContract;
    setStorageNodeMetadata(metadata: StorageNodeMetadata | undefined): Promise<void>;
    getStorageNodeMetadata(nodeAddress: EthereumAddress): Promise<StorageNodeMetadata>;
}
