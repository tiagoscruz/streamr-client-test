import type { Signer } from '@ethersproject/abstract-signer';
import { EthereumAddress } from '@streamr/utils';
import { StrictStreamrClientConfig } from './Config';
export declare const AuthenticationInjectionToken: unique symbol;
export interface Authentication {
    getAddress: () => Promise<EthereumAddress>;
    createMessageSignature: (payload: string) => Promise<string>;
    getStreamRegistryChainSigner: () => Promise<Signer>;
}
export declare const createPrivateKeyAuthentication: (key: string, config: Pick<StrictStreamrClientConfig, 'contracts'>) => Authentication;
export declare const createAuthentication: (config: Pick<StrictStreamrClientConfig, 'auth' | 'contracts'>) => Authentication;
