import 'reflect-metadata';
import type { BigNumber } from '@ethersproject/bignumber';
import type { Overrides } from '@ethersproject/contracts';
import type { ExternalProvider } from '@ethersproject/providers';
import { MarkOptional, DeepRequired } from 'ts-essentials';
import { TrackerRegistryRecord } from '@streamr/protocol';
import { LogLevel } from '@streamr/utils';
import { IceServer, Location } from '@streamr/network-node';
import type { ConnectionInfo } from '@ethersproject/web';
export interface ProviderAuthConfig {
    ethereum: ExternalProvider;
}
export interface PrivateKeyAuthConfig {
    privateKey: string;
    address?: string;
}
export interface TrackerRegistryContract {
    jsonRpcProvider?: ConnectionInfo;
    contractAddress: string;
}
export interface ChainConnectionInfo {
    rpcs: ConnectionInfo[];
    chainId?: number;
    name?: string;
}
export interface EthereumNetworkConfig {
    chainId: number;
    overrides?: Overrides;
    highGasPriceStrategy?: boolean;
    /** @deprecated */
    gasPriceStrategy?: (estimatedGasPrice: BigNumber) => BigNumber;
}
/**
 * @category Important
 */
export interface StreamrClientConfig {
    /** Custom human-readable debug id for client. Used in logging. */
    id?: string;
    logLevel?: LogLevel;
    /**
    * Authentication: identity used by this StreamrClient instance.
    * Can contain member privateKey or (window.)ethereum
    */
    auth?: PrivateKeyAuthConfig | ProviderAuthConfig;
    /** Attempt to order messages */
    orderMessages?: boolean;
    gapFill?: boolean;
    maxGapRequests?: number;
    retryResendAfter?: number;
    gapFillTimeout?: number;
    network?: {
        id?: string;
        acceptProxyConnections?: boolean;
        trackers?: TrackerRegistryRecord[] | TrackerRegistryContract;
        trackerPingInterval?: number;
        trackerConnectionMaintenanceInterval?: number;
        webrtcDisallowPrivateAddresses?: boolean;
        newWebrtcConnectionTimeout?: number;
        webrtcDatachannelBufferThresholdLow?: number;
        webrtcDatachannelBufferThresholdHigh?: number;
        /**
         * The maximum amount of outgoing messages to be buffered on a single WebRTC connection.
         */
        webrtcSendBufferMaxMessageCount?: number;
        disconnectionWaitTime?: number;
        peerPingInterval?: number;
        rttUpdateTimeout?: number;
        iceServers?: ReadonlyArray<IceServer>;
        location?: Location;
    };
    contracts?: {
        streamRegistryChainAddress?: string;
        streamStorageRegistryChainAddress?: string;
        storageNodeRegistryChainAddress?: string;
        mainChainRPCs?: ChainConnectionInfo;
        streamRegistryChainRPCs?: ChainConnectionInfo;
        ethereumNetworks?: Record<string, EthereumNetworkConfig>;
        /** Some TheGraph instance, that indexes the streamr registries */
        theGraphUrl?: string;
        maxConcurrentCalls?: number;
    };
    decryption?: {
        keyRequestTimeout?: number;
        maxKeyRequestsPerSecond?: number;
    };
    metrics?: {
        periods?: {
            streamId: string;
            duration: number;
        }[];
        maxPublishDelay?: number;
    } | boolean;
    cache?: {
        maxSize?: number;
        maxAge?: number;
    };
}
export type StrictStreamrClientConfig = MarkOptional<Required<StreamrClientConfig>, 'auth' | 'metrics'> & {
    network: MarkOptional<Exclude<Required<StreamrClientConfig['network']>, undefined>, 'location'>;
    contracts: Exclude<Required<StreamrClientConfig['contracts']>, undefined>;
    decryption: Exclude<Required<StreamrClientConfig['decryption']>, undefined>;
    cache: Exclude<Required<StreamrClientConfig['cache']>, undefined>;
    _timeouts: Exclude<DeepRequired<StreamrClientConfig['_timeouts']>, undefined>;
};
export declare const STREAMR_STORAGE_NODE_GERMANY = "0x31546eEA76F2B2b3C5cC06B1c93601dc35c9D916";
/** @deprecated */
export declare const STREAM_CLIENT_DEFAULTS: Omit<StrictStreamrClientConfig, 'id' | 'auth' | 'network'> & {
    network: Omit<StrictStreamrClientConfig['network'], 'id'>;
};
export declare const createStrictConfig: (input?: StreamrClientConfig) => StrictStreamrClientConfig;
export declare const validateConfig: (data: unknown) => StrictStreamrClientConfig | never;
export declare const redactConfig: (config: StrictStreamrClientConfig) => void;
export declare const ConfigInjectionToken: unique symbol;
