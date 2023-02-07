import { BigNumber } from '@ethersproject/bignumber';
import { EthereumAddress } from '@streamr/utils';
export declare enum StreamPermission {
    EDIT = "edit",
    DELETE = "delete",
    PUBLISH = "publish",
    SUBSCRIBE = "subscribe",
    GRANT = "grant"
}
export interface UserPermissionQuery {
    streamId: string;
    permission: StreamPermission;
    user: string;
    allowPublic: boolean;
}
export interface PublicPermissionQuery {
    streamId: string;
    permission: StreamPermission;
    public: true;
}
export type PermissionQuery = UserPermissionQuery | PublicPermissionQuery;
export interface UserPermissionAssignment {
    permissions: StreamPermission[];
    user: string;
}
export interface PublicPermissionAssignment {
    permissions: StreamPermission[];
    public: true;
}
export type PermissionAssignment = UserPermissionAssignment | PublicPermissionAssignment;
export declare const PUBLIC_PERMISSION_ADDRESS = "0x0000000000000000000000000000000000000000";
export type PermissionQueryResult = {
    id: string;
    userAddress: EthereumAddress;
} & ChainPermissions;
export interface ChainPermissions {
    canEdit: boolean;
    canDelete: boolean;
    publishExpiration: BigNumber;
    subscribeExpiration: BigNumber;
    canGrant: boolean;
}
export declare const isPublicPermissionQuery: (query: PermissionQuery) => query is PublicPermissionQuery;
export declare const isPublicPermissionAssignment: (query: PermissionAssignment) => query is PublicPermissionAssignment;
export declare const streamPermissionToSolidityType: (permission: StreamPermission) => BigNumber;
export declare const convertChainPermissionsToStreamPermissions: (chainPermissions: ChainPermissions) => StreamPermission[];
export declare const convertStreamPermissionsToChainPermission: (permissions: StreamPermission[]) => ChainPermissions;
