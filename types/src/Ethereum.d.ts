import type { Provider } from '@ethersproject/providers';
import type { Overrides } from '@ethersproject/contracts';
import { StrictStreamrClientConfig } from './Config';
export declare const generateEthereumAccount: () => {
    address: string;
    privateKey: string;
};
export declare const getMainnetProvider: (config: Pick<StrictStreamrClientConfig, 'contracts'>) => Provider;
export declare const getStreamRegistryChainProvider: (config: Pick<StrictStreamrClientConfig, 'contracts'>) => Provider;
export declare const getAllStreamRegistryChainProviders: (config: Pick<StrictStreamrClientConfig, 'contracts'>) => Provider[];
export declare const getStreamRegistryOverrides: (config: Pick<StrictStreamrClientConfig, 'contracts'>) => Overrides;
