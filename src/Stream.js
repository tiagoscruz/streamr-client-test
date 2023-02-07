"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Stream = exports.VALID_FIELD_TYPES = void 0;
const protocol_1 = require("@streamr/protocol");
const lodash_1 = require("lodash");
const utils_1 = require("./utils/utils");
const waitForAssignmentsToPropagate_1 = require("./utils/waitForAssignmentsToPropagate");
const utils_2 = require("@streamr/utils");
const iterators_1 = require("./utils/iterators");
const StreamIDBuilder_1 = require("./StreamIDBuilder");
const Subscription_1 = require("./subscribe/Subscription");
const Message_1 = require("./Message");
exports.VALID_FIELD_TYPES = ['number', 'string', 'boolean', 'list', 'map'];
function getFieldType(value) {
    const type = typeof value;
    switch (true) {
        case Array.isArray(value): {
            return 'list';
        }
        case type === 'object': {
            return 'map';
        }
        case exports.VALID_FIELD_TYPES.includes(type): {
            // see https://github.com/microsoft/TypeScript/issues/36275
            return type;
        }
        default: {
            return undefined;
        }
    }
}
/**
 * A convenience API for managing and accessing an individual stream.
 *
 * @category Important
 */
/* eslint-disable no-underscore-dangle */
class Stream {
    /** @internal */
    constructor(id, metadata, resends, publisher, subscriber, streamRegistryCached, streamRegistry, streamStorageRegistry, loggerFactory, eventEmitter, config) {
        this.id = id;
        this.metadata = {
            partitions: 1,
            // TODO should we remove this default or make config as a required StreamMetadata field?
            config: {
                fields: []
            },
            ...metadata
        };
        this._resends = resends;
        this._publisher = publisher;
        this._subscriber = subscriber;
        this._streamRegistryCached = streamRegistryCached;
        this._streamRegistry = streamRegistry;
        this._streamStorageRegistry = streamStorageRegistry;
        this._loggerFactory = loggerFactory;
        this._eventEmitter = eventEmitter;
        this._config = config;
    }
    /**
     * Updates the metadata of the stream by merging with the existing metadata.
     */
    async update(metadata) {
        const merged = {
            ...this.getMetadata(),
            ...metadata
        };
        try {
            await this._streamRegistry.updateStream(this.id, merged);
        }
        finally {
            this._streamRegistryCached.clearStream(this.id);
        }
        this.metadata = merged;
    }
    /**
     * Returns the partitions of the stream.
     */
    getStreamParts() {
        return (0, lodash_1.range)(0, this.getMetadata().partitions).map((p) => (0, protocol_1.toStreamPartID)(this.id, p));
    }
    /**
     * Returns the metadata of the stream.
     */
    getMetadata() {
        return this.metadata;
    }
    /**
     * Deletes the stream.
     *
     * @remarks Stream instance should not be used afterwards.
     */
    async delete() {
        try {
            await this._streamRegistry.deleteStream(this.id);
        }
        finally {
            this._streamRegistryCached.clearStream(this.id);
        }
    }
    /**
     * Attempts to detect and update the {@link StreamMetadata.config} metadata of the stream by performing a resend.
     *
     * @remarks Only works on stored streams.
     *
     * @returns be mindful that in the case of there being zero messages stored, the returned promise will resolve even
     * though fields were not updated
     */
    async detectFields() {
        // Get last message of the stream to be used for field detecting
        const sub = await this._resends.last((0, protocol_1.toStreamPartID)(this.id, StreamIDBuilder_1.DEFAULT_PARTITION), {
            count: 1,
        });
        const receivedMsgs = await (0, iterators_1.collect)(sub);
        if (!receivedMsgs.length) {
            return;
        }
        const lastMessage = receivedMsgs[0].content;
        const fields = Object.entries(lastMessage).map(([name, value]) => {
            const type = getFieldType(value);
            return !!type && {
                name,
                type,
            };
        }).filter(Boolean); // see https://github.com/microsoft/TypeScript/issues/30621
        // Save field config back to the stream
        await this.update({
            config: {
                fields
            }
        });
    }
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
    async addToStorageNode(storageNodeAddress, waitOptions = {}) {
        let assignmentSubscription;
        const normalizedNodeAddress = (0, utils_2.toEthereumAddress)(storageNodeAddress);
        try {
            const streamPartId = (0, protocol_1.toStreamPartID)((0, utils_1.formStorageNodeAssignmentStreamId)(normalizedNodeAddress), StreamIDBuilder_1.DEFAULT_PARTITION);
            assignmentSubscription = new Subscription_1.Subscription(streamPartId, this._loggerFactory);
            await this._subscriber.add(assignmentSubscription);
            const propagationPromise = (0, waitForAssignmentsToPropagate_1.waitForAssignmentsToPropagate)(assignmentSubscription, {
                id: this.id,
                partitions: this.getMetadata().partitions
            });
            await this._streamStorageRegistry.addStreamToStorageNode(this.id, normalizedNodeAddress);
            await (0, utils_2.withTimeout)(propagationPromise, 
            // eslint-disable-next-line no-underscore-dangle
            waitOptions.timeout ?? this._config._timeouts.storageNode.timeout, 'storage node did not respond');
        }
        finally {
            this._streamRegistryCached.clearStream(this.id);
            await assignmentSubscription?.unsubscribe(); // should never reject...
        }
    }
    /**
     * See {@link StreamrClient.removeStreamFromStorageNode | StreamrClient.removeStreamFromStorageNode}.
     */
    async removeFromStorageNode(nodeAddress) {
        try {
            return this._streamStorageRegistry.removeStreamFromStorageNode(this.id, (0, utils_2.toEthereumAddress)(nodeAddress));
        }
        finally {
            this._streamRegistryCached.clearStream(this.id);
        }
    }
    /**
     * See {@link StreamrClient.getStorageNodes | StreamrClient.getStorageNodes}.
     */
    async getStorageNodes() {
        return this._streamStorageRegistry.getStorageNodes(this.id);
    }
    /**
     * See {@link StreamrClient.publish | StreamrClient.publish}.
     *
     * @category Important
     */
    async publish(content, metadata) {
        const result = await this._publisher.publish(this.id, content, metadata);
        this._eventEmitter.emit('publish', undefined);
        return (0, Message_1.convertStreamMessageToMessage)(result);
    }
    /** @internal */
    static parseMetadata(metadata) {
        try {
            // TODO we could pick the fields of StreamMetadata explicitly, so that this
            // object can't contain extra fields
            // TODO we should maybe also check that partitions field is available
            // (if we do that we can return StreamMetadata instead of Partial<StreamMetadata>)
            return JSON.parse(metadata);
        }
        catch (error) {
            throw new Error(`Could not parse properties from onchain metadata: ${metadata}`);
        }
    }
    /**
     * See {@link StreamrClient.hasPermission | StreamrClient.hasPermission}.
     *
     * @category Important
     */
    async hasPermission(query) {
        return this._streamRegistry.hasPermission({
            streamId: this.id,
            ...query
        });
    }
    /**
     * See {@link StreamrClient.getPermissions | StreamrClient.getPermissions}.
     *
     * @category Important
     */
    async getPermissions() {
        return this._streamRegistry.getPermissions(this.id);
    }
    /**
     * See {@link StreamrClient.grantPermissions | StreamrClient.grantPermissions}.
     *
     * @category Important
     */
    async grantPermissions(...assignments) {
        return this._streamRegistry.grantPermissions(this.id, ...assignments);
    }
    /**
     * See {@link StreamrClient.revokePermissions | StreamrClient.revokePermissions}.
     *
     * @category Important
     */
    async revokePermissions(...assignments) {
        return this._streamRegistry.revokePermissions(this.id, ...assignments);
    }
}
exports.Stream = Stream;
//# sourceMappingURL=Stream.js.map