import { StreamID } from '@streamr/protocol';
import { StreamQueryResult } from './StreamRegistry';
import { StreamPermission, ChainPermissions } from '../permission';
import { SynchronizedGraphQLClient } from '../utils/SynchronizedGraphQLClient';
import { Stream } from '../Stream';
import { EthereumAddress, Logger } from '@streamr/utils';
export interface SearchStreamsPermissionFilter {
    user: string;
    allOf?: StreamPermission[];
    anyOf?: StreamPermission[];
    allowPublic: boolean;
}
export type SearchStreamsResultItem = {
    id: string;
    userAddress: EthereumAddress;
    stream: StreamQueryResult;
} & ChainPermissions;
export declare const searchStreams: (term: string | undefined, permissionFilter: SearchStreamsPermissionFilter | undefined, graphQLClient: SynchronizedGraphQLClient, parseStream: (id: StreamID, metadata: string) => Stream, logger: Logger) => AsyncGenerator<Stream>;
