import { StreamID, StreamPartID } from '@streamr/protocol';
import { PermissionAssignment, PublicPermissionQuery, UserPermissionQuery } from './permission';
import { PublishMetadata } from '../src/publish/Publisher';
import { Message } from './Message';
export interface StreamMetadata {
    /**
     * Determines how many partitions this stream consist of.
     */
    partitions: number;
    /**
     * Human-readable description of this stream.
     */
    description?: string;
    /**
     * Defines the structure of the content (payloads) of messages in this stream.
     *
     * @remarks Not validated, purely for informational value.
     */
    config?: {
        fields: Field[];
    };
    /**
     * If this stream is assigned to storage nodes, how many days (at minimum) should the data be retained for.
     */
    storageDays?: number;
    /**
     * After how many hours of inactivity (i.e. no messages) should a stream be considered inactive. Purely for
     * informational purposes.
     */
    inactivityThresholdHours?: number;
}
export declare const VALID_FIELD_TYPES: readonly ["number", "string", "boolean", "list", "map"];
export interface Field {
    name: string;
    type: typeof VALID_FIELD_TYPES[number];
}
/**
 * A convenience API for managing and accessing an individual stream.
 *
 * @category Important
 */
export declare class Stream {
    readonly id: StreamID;
    private metadata;
    private readonly _resends;
    private readonly _publisher;
    private readonly _subscriber;
    private readonly _streamRegistry;
    private readonly _streamRegistryCached;
    private readonly _streamStorageRegistry;
    private readonly _loggerFactory;
    private readonly _eventEmitter;
    private readonly _config;
    /**
     * Updates the metadata of the stream by merging with the existing metadata.
     */
    update(metadata: Partial<StreamMetadata>): Promise<void>;
    /**
     * Returns the partitions of the stream.
     */
    getStreamParts(): StreamPartID[];
    /**
     * Returns the metadata of the stream.
     */
    getMetadata(): StreamMetadata;
    /**
     * Deletes the stream.
     *
     * @remarks Stream instance should not be used afterwards.
     */
    delete(): Promise<void>;
    /**
     * Attempts to detect and update the {@link StreamMetadata.config} metadata of the stream by performing a resend.
     *
     * @remarks Only works on stored streams.
     *
     * @returns be mindful that in the case of there being zero messages stored, the returned promise will resolve even
     * though fields were not updated
     */
    detectFields(): Promise<void>;
    /**
     * Assigns the stream to a storage node.
     *
     * @category Important
     *
     * @param waitOptions - control how long to wait for storage node to pick up on assignment
     * @returns a resolved promise if (1) stream was assigned to storage node and (2) the storage node acknowledged the
     * assignment within `timeout`, otherwise rejects. Notice that is possible for this promise to reject but for the
     * storage node assignment to go through eventually.
     */
    addToStorageNode(storageNodeAddress: string, waitOptions?: {
        timeout?: number;
    }): Promise<void>;
    /**
     * See {@link StreamrClient.removeStreamFromStorageNode | StreamrClient.removeStreamFromStorageNode}.
     */
    removeFromStorageNode(nodeAddress: string): Promise<void>;
    /**
     * See {@link StreamrClient.getStorageNodes | StreamrClient.getStorageNodes}.
     */
    getStorageNodes(): Promise<string[]>;
    /**
     * See {@link StreamrClient.publish | StreamrClient.publish}.
     *
     * @category Important
     */
    publish(content: unknown, metadata?: PublishMetadata): Promise<Message>;
    /**
     * See {@link StreamrClient.hasPermission | StreamrClient.hasPermission}.
     *
     * @category Important
     */
    hasPermission(query: Omit<UserPermissionQuery, 'streamId'> | Omit<PublicPermissionQuery, 'streamId'>): Promise<boolean>;
    /**
     * See {@link StreamrClient.getPermissions | StreamrClient.getPermissions}.
     *
     * @category Important
     */
    getPermissions(): Promise<PermissionAssignment[]>;
    /**
     * See {@link StreamrClient.grantPermissions | StreamrClient.grantPermissions}.
     *
     * @category Important
     */
    grantPermissions(...assignments: PermissionAssignment[]): Promise<void>;
    /**
     * See {@link StreamrClient.revokePermissions | StreamrClient.revokePermissions}.
     *
     * @category Important
     */
    revokePermissions(...assignments: PermissionAssignment[]): Promise<void>;
}
