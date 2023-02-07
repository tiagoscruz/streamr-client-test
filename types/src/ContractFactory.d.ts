import { Contract, ContractInterface } from '@ethersproject/contracts';
import { Provider } from '@ethersproject/providers';
import { Signer } from '@ethersproject/abstract-signer';
import { ObservableContract } from './utils/contract';
import { SynchronizedGraphQLClient } from './utils/SynchronizedGraphQLClient';
import { StrictStreamrClientConfig } from './Config';
import { EthereumAddress } from '@streamr/utils';
import { LoggerFactory } from './utils/LoggerFactory';
export declare class ContractFactory {
    private readonly graphQLClient;
    private readonly loggerFactory;
    private readonly config;
    constructor(graphQLClient: SynchronizedGraphQLClient, loggerFactory: LoggerFactory, config: Pick<StrictStreamrClientConfig, 'contracts'>);
    createReadContract<T extends Contract>(address: EthereumAddress, contractInterface: ContractInterface, provider: Provider, name: string): ObservableContract<T>;
    createWriteContract<T extends Contract>(address: EthereumAddress, contractInterface: ContractInterface, signer: Signer, name: string): ObservableContract<T>;
}
