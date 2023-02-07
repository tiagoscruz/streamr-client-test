import type { Provider } from '@ethersproject/providers';
import { TrackerRegistryRecord, TrackerRegistry } from '@streamr/protocol';
import { EthereumAddress } from '@streamr/utils';
export declare function getTrackerRegistryFromContract({ contractAddress, jsonRpcProvider }: {
    contractAddress: EthereumAddress;
    jsonRpcProvider: Provider;
}): Promise<TrackerRegistry<TrackerRegistryRecord>>;
