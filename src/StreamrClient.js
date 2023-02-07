"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StreamrClient = void 0;
require("reflect-metadata");
require("./utils/PatchTsyringe");
const tsyringe_1 = require("tsyringe");
const Ethereum_1 = require("./Ethereum");
const promises_1 = require("./utils/promises");
const Config_1 = require("./Config");
const Publisher_1 = require("./publish/Publisher");
const Subscriber_1 = require("./subscribe/Subscriber");
const ProxyPublishSubscribe_1 = require("./ProxyPublishSubscribe");
const Resends_1 = require("./subscribe/Resends");
const ResendSubscription_1 = require("./subscribe/ResendSubscription");
const NetworkNodeFacade_1 = require("./NetworkNodeFacade");
const DestroySignal_1 = require("./DestroySignal");
const GroupKeyStore_1 = require("./encryption/GroupKeyStore");
const StorageNodeRegistry_1 = require("./registry/StorageNodeRegistry");
const StreamRegistry_1 = require("./registry/StreamRegistry");
const Subscription_1 = require("./subscribe/Subscription");
const StreamIDBuilder_1 = require("./StreamIDBuilder");
const events_1 = require("./events");
const MetricsPublisher_1 = require("./MetricsPublisher");
const Authentication_1 = require("./Authentication");
const StreamStorageRegistry_1 = require("./registry/StreamStorageRegistry");
const PublisherKeyExchange_1 = require("./encryption/PublisherKeyExchange");
const utils_1 = require("@streamr/utils");
const LoggerFactory_1 = require("./utils/LoggerFactory");
const Message_1 = require("./Message");
const HttpUtil_1 = require("./HttpUtil");
const lodash_1 = require("lodash");
const Persistence_1 = require("./utils/persistence/Persistence");
/**
 * The main API used to interact with Streamr.
 *
 * @category Important
 */
class StreamrClient {
    constructor(config = {}, persistence, 
    /** @internal */
    parentContainer = tsyringe_1.container) {
        this._connect = (0, promises_1.pOnce)(async () => {
            await this.node.startNode();
        });
        this._destroy = (0, promises_1.pOnce)(async () => {
            this.eventEmitter.removeAllListeners();
            // eslint-disable-next-line no-underscore-dangle
            this._connect.reset(); // reset connect (will error on next call)
            const tasks = [
                this.destroySignal.destroy().then(() => undefined),
                this.subscriber.unsubscribe(),
                this.groupKeyStore.stop()
            ];
            await Promise.allSettled(tasks);
            await Promise.all(tasks);
        });
        const strictConfig = (0, Config_1.createStrictConfig)(config);
        const authentication = (0, Authentication_1.createAuthentication)(strictConfig);
        (0, Config_1.redactConfig)(strictConfig);
        const container = parentContainer.createChildContainer();
        container.register(Authentication_1.AuthenticationInjectionToken, { useValue: authentication });
        container.register(Config_1.ConfigInjectionToken, { useValue: strictConfig });
        container.register(Persistence_1.PersistenceInjectionToken, { useValue: persistence || null });
        this.id = strictConfig.id;
        this.config = strictConfig;
        this.node = container.resolve(NetworkNodeFacade_1.NetworkNodeFacade);
        this.authentication = container.resolve(Authentication_1.AuthenticationInjectionToken);
        this.resends = container.resolve(Resends_1.Resends);
        this.publisher = container.resolve(Publisher_1.Publisher);
        this.subscriber = container.resolve(Subscriber_1.Subscriber);
        this.proxyPublishSubscribe = container.resolve(ProxyPublishSubscribe_1.ProxyPublishSubscribe);
        this.groupKeyStore = container.resolve(GroupKeyStore_1.GroupKeyStore);
        this.destroySignal = container.resolve(DestroySignal_1.DestroySignal);
        this.streamRegistry = container.resolve(StreamRegistry_1.StreamRegistry);
        this.streamStorageRegistry = container.resolve(StreamStorageRegistry_1.StreamStorageRegistry);
        this.storageNodeRegistry = container.resolve(StorageNodeRegistry_1.StorageNodeRegistry);
        this.loggerFactory = container.resolve(LoggerFactory_1.LoggerFactory);
        this.streamIdBuilder = container.resolve(StreamIDBuilder_1.StreamIDBuilder);
        this.eventEmitter = container.resolve(events_1.StreamrClientEventEmitter);
        container.resolve(PublisherKeyExchange_1.PublisherKeyExchange); // side effect: activates publisher key exchange
        container.resolve(MetricsPublisher_1.MetricsPublisher); // side effect: activates metrics publisher
    }
    // --------------------------------------------------------------------------------------------
    // Publish
    // --------------------------------------------------------------------------------------------
    /**
     * Publishes a message to a stream partition in the network.
     *
     * @category Important
     *
     * @param streamDefinition - the stream or stream partition to publish the message to
     * @param content - the content (the payload) of the message (must be JSON serializable)
     * @param metadata - provide additional metadata to be included in the message or to control the publishing process
     * @returns the published message (note: the field {@link Message.content} is encrypted if the stream is private)
     */
    async publish(streamDefinition, content, metadata) {
        const result = await this.publisher.publish(streamDefinition, content, metadata);
        this.eventEmitter.emit('publish', undefined);
        return (0, Message_1.convertStreamMessageToMessage)(result);
    }
    /**
     * Manually updates the encryption key used when publishing messages to a given stream.
     */
    async updateEncryptionKey(opts) {
        if (opts.streamId === undefined) {
            throw new Error('streamId required');
        }
        const streamId = await this.streamIdBuilder.toStreamID(opts.streamId);
        const queue = await this.publisher.getGroupKeyQueue(streamId);
        if (opts.distributionMethod === 'rotate') {
            await queue.rotate(opts.key);
        }
        else if (opts.distributionMethod === 'rekey') {
            await queue.rekey(opts.key);
        }
        else {
            throw new Error(`assertion failed: distribution method ${opts.distributionMethod}`);
        }
    }
    /**
     * Adds an encryption key for a given stream to the key store.
     *
     * @remarks Keys will be added to the store automatically by the client as encountered. This method can be used to
     * manually add some known keys into the store.
     */
    async addEncryptionKey(key, streamIdOrPath) {
        const streamId = await this.streamIdBuilder.toStreamID(streamIdOrPath);
        await this.groupKeyStore.add(key, streamId);
    }
    // --------------------------------------------------------------------------------------------
    // Subscribe
    // --------------------------------------------------------------------------------------------
    /**
     * Subscribes to a stream partition in the network.
     *
     * @category Important
     *
     * @param options - the stream or stream partition to subscribe to,
     * additionally a resend can be performed by providing resend options
     * @param onMessage - callback will be invoked for each message received in subscription
     * @returns a {@link Subscription} that can be used to manage the subscription etc.
     */
    async subscribe(options, onMessage) {
        const streamPartId = await this.streamIdBuilder.toStreamPartID(options);
        const sub = (options.resend !== undefined)
            ? new ResendSubscription_1.ResendSubscription(streamPartId, options.resend, this.resends, this.loggerFactory, this.config)
            : new Subscription_1.Subscription(streamPartId, this.loggerFactory);
        await this.subscriber.add(sub);
        if (onMessage !== undefined) {
            sub.useLegacyOnMessageHandler(onMessage);
        }
        this.eventEmitter.emit('subscribe', undefined);
        return sub;
    }
    /**
     * Unsubscribes from streams or stream partitions in the network.
     *
     * @remarks no-op if subscription does not exist
     *
     * @category Important
     *
     * @param streamDefinitionOrSubscription - leave as `undefined` to unsubscribe from all existing subscriptions.
     */
    unsubscribe(streamDefinitionOrSubscription) {
        return this.subscriber.unsubscribe(streamDefinitionOrSubscription);
    }
    /**
     * Returns a list of subscriptions matching the given criteria.
     *
     * @category Important
     *
     * @param streamDefinition - leave as `undefined` to get all subscriptions
     */
    getSubscriptions(streamDefinition) {
        return this.subscriber.getSubscriptions(streamDefinition);
    }
    // --------------------------------------------------------------------------------------------
    // Resend
    // --------------------------------------------------------------------------------------------
    /**
     * Performs a resend of stored historical data.
     *
     * @category Important
     *
     * @param streamDefinition - the stream partition for which data should be resent
     * @param options - defines the kind of resend that should be performed
     * @param onMessage - callback will be invoked for each message retrieved
     * @returns a {@link MessageStream} that provides an alternative way of iterating messages. Rejects if the stream is
     * not stored (i.e. is not assigned to a storage node).
     */
    async resend(streamDefinition, options, onMessage) {
        const streamPartId = await this.streamIdBuilder.toStreamPartID(streamDefinition);
        const messageStream = await this.resends.resend(streamPartId, options);
        if (onMessage !== undefined) {
            messageStream.useLegacyOnMessageHandler(onMessage);
        }
        return messageStream;
    }
    /**
     * Waits for a message to be stored by a storage node.
     *
     * @param message - the message to be awaited for
     * @param options - additional options for controlling waiting and message matching
     * @returns rejects if message was found in storage before timeout
     */
    waitForStorage(message, options) {
        return this.resends.waitForStorage(message, options);
    }
    // --------------------------------------------------------------------------------------------
    // Stream management
    // --------------------------------------------------------------------------------------------
    /**
     * Gets a stream.
     *
     * @category Important
     *
     * @returns rejects if the stream is not found
     */
    getStream(streamIdOrPath) {
        return this.streamRegistry.getStream(streamIdOrPath);
    }
    /**
     * Creates a new stream.
     *
     * @category Important
     *
     * @param propsOrStreamIdOrPath - the stream id to be used for the new stream, and optionally, any
     * associated metadata
     */
    async createStream(propsOrStreamIdOrPath) {
        const props = typeof propsOrStreamIdOrPath === 'object' ? propsOrStreamIdOrPath : { id: propsOrStreamIdOrPath };
        const streamId = await this.streamIdBuilder.toStreamID(props.id);
        return this.streamRegistry.createStream(streamId, {
            partitions: 1,
            ...(0, lodash_1.omit)(props, 'id')
        });
    }
    /**
     * Gets a stream, creating one if it does not exist.
     *
     * @category Important
     *
     * @param props - the stream id to get or create. Field `partitions` is only used if creating the stream.
     */
    async getOrCreateStream(props) {
        try {
            return await this.getStream(props.id);
        }
        catch (err) {
            if (err.errorCode === HttpUtil_1.ErrorCode.NOT_FOUND) {
                return this.createStream(props);
            }
            throw err;
        }
    }
    /**
     * Updates the metadata of a stream.
     *
     * @param props - the stream id and the metadata fields to be updated
     */
    async updateStream(props) {
        const streamId = await this.streamIdBuilder.toStreamID(props.id);
        return this.streamRegistry.updateStream(streamId, (0, lodash_1.omit)(props, 'id'));
    }
    /**
     * Deletes a stream.
     */
    deleteStream(streamIdOrPath) {
        return this.streamRegistry.deleteStream(streamIdOrPath);
    }
    /**
     * Searches for streams based on given criteria.
     *
     * @param term - a search term that should be part of the stream id of a result
     * @param permissionFilter - permissions that should be in effect for a result
     */
    searchStreams(term, permissionFilter) {
        return this.streamRegistry.searchStreams(term, permissionFilter);
    }
    // --------------------------------------------------------------------------------------------
    // Permissions
    // --------------------------------------------------------------------------------------------
    /**
     * Gets all ethereum addresses that have {@link StreamPermission.PUBLISH} permission to the stream.
     */
    getStreamPublishers(streamIdOrPath) {
        return this.streamRegistry.getStreamPublishers(streamIdOrPath);
    }
    /**
     * Gets all ethereum addresses that have {@link StreamPermission.SUBSCRIBE} permission to the stream.
     */
    getStreamSubscribers(streamIdOrPath) {
        return this.streamRegistry.getStreamSubscribers(streamIdOrPath);
    }
    /**
     * Checks whether the given permission is in effect.
     */
    hasPermission(query) {
        return this.streamRegistry.hasPermission(query);
    }
    /**
     * Returns the list of all permissions in effect for a given stream.
     */
    getPermissions(streamIdOrPath) {
        return this.streamRegistry.getPermissions(streamIdOrPath);
    }
    /**
     * Grants permissions on a given stream.
     */
    grantPermissions(streamIdOrPath, ...assignments) {
        return this.streamRegistry.grantPermissions(streamIdOrPath, ...assignments);
    }
    /**
     * Revokes permissions on a given stream.
     */
    revokePermissions(streamIdOrPath, ...assignments) {
        return this.streamRegistry.revokePermissions(streamIdOrPath, ...assignments);
    }
    /**
     * Sets a list of permissions to be in effect.
     *
     * @remarks Can be used to set the permissions of multiple streams in one transaction. Great for doing bulk
     * operations and saving gas costs. Notice that the behaviour is overwriting, therefore any existing permissions not
     * defined will be removed (per stream).
     */
    setPermissions(...items) {
        return this.streamRegistry.setPermissions(...items);
    }
    /**
     * Checks whether a given ethereum address has {@link StreamPermission.PUBLISH} permission to a stream.
     */
    async isStreamPublisher(streamIdOrPath, userAddress) {
        return this.streamRegistry.isStreamPublisher(streamIdOrPath, (0, utils_1.toEthereumAddress)(userAddress));
    }
    /**
     * Checks whether a given ethereum address has {@link StreamPermission.SUBSCRIBE} permission to a stream.
     */
    async isStreamSubscriber(streamIdOrPath, userAddress) {
        return this.streamRegistry.isStreamSubscriber(streamIdOrPath, (0, utils_1.toEthereumAddress)(userAddress));
    }
    // --------------------------------------------------------------------------------------------
    // Storage
    // --------------------------------------------------------------------------------------------
    /**
     * Assigns a stream to a storage node.
     */
    async addStreamToStorageNode(streamIdOrPath, storageNodeAddress) {
        return this.streamStorageRegistry.addStreamToStorageNode(streamIdOrPath, (0, utils_1.toEthereumAddress)(storageNodeAddress));
    }
    /**
     * Unassigns a stream from a storage node.
     */
    async removeStreamFromStorageNode(streamIdOrPath, storageNodeAddress) {
        return this.streamStorageRegistry.removeStreamFromStorageNode(streamIdOrPath, (0, utils_1.toEthereumAddress)(storageNodeAddress));
    }
    /**
     * Checks whether a stream is assigned to a storage node.
     */
    async isStoredStream(streamIdOrPath, storageNodeAddress) {
        return this.streamStorageRegistry.isStoredStream(streamIdOrPath, (0, utils_1.toEthereumAddress)(storageNodeAddress));
    }
    /**
     * Gets all streams assigned to a storage node.
     *
     * @returns a list of {@link Stream} as well as `blockNumber` of result (i.e. blockchain state)
     */
    async getStoredStreams(storageNodeAddress) {
        return this.streamStorageRegistry.getStoredStreams((0, utils_1.toEthereumAddress)(storageNodeAddress));
    }
    /**
     * Gets a list of storage nodes.
     *
     * @param streamIdOrPath - if a stream is given, returns the list of storage nodes the stream has been assigned to;
     * leave as `undefined` to return all storage nodes
     */
    async getStorageNodes(streamIdOrPath) {
        return this.streamStorageRegistry.getStorageNodes(streamIdOrPath);
    }
    /**
     * Sets the metadata of a storage node in the storage node registry.
     *
     * @remarks Acts on behalf of the wallet associated with the current {@link StreamrClient} instance.
     *
     * @param metadata - if `undefined`, removes the storage node from the registry
     */
    setStorageNodeMetadata(metadata) {
        return this.storageNodeRegistry.setStorageNodeMetadata(metadata);
    }
    /**
     * Gets the metadata of a storage node from the storage node registry.
     *
     * @returns rejects if the storage node is not found
     */
    async getStorageNodeMetadata(nodeAddress) {
        return this.storageNodeRegistry.getStorageNodeMetadata((0, utils_1.toEthereumAddress)(nodeAddress));
    }
    // --------------------------------------------------------------------------------------------
    // Authentication
    // --------------------------------------------------------------------------------------------
    /**
     * Gets the Ethereum address of the wallet associated with the current {@link StreamrClient} instance.
     */
    getAddress() {
        return this.authentication.getAddress();
    }
    // --------------------------------------------------------------------------------------------
    // Network node
    // --------------------------------------------------------------------------------------------
    /**
     * @deprecated This in an internal method
     */
    getNode() {
        return this.node.getNode();
    }
    openProxyConnections(streamDefinition, nodeIds, direction) {
        return this.proxyPublishSubscribe.openProxyConnections(streamDefinition, nodeIds, direction);
    }
    closeProxyConnections(streamDefinition, nodeIds, direction) {
        return this.proxyPublishSubscribe.closeProxyConnections(streamDefinition, nodeIds, direction);
    }
    // --------------------------------------------------------------------------------------------
    // Lifecycle
    // --------------------------------------------------------------------------------------------
    /**
     * Used to manually initialize the network stack and connect to the network.
     *
     * @remarks Connecting is handled automatically by the client. Generally this method need not be called by the user.
     */
    connect() {
        // eslint-disable-next-line no-underscore-dangle
        return this._connect();
    }
    /**
     * Destroys an instance of a {@link StreamrClient} by disconnecting from peers, clearing any pending tasks, and
     * freeing up resources. This should be called once a user is done with the instance.
     *
     * @remarks As the name implies, the client instance (or any streams or subscriptions returned by it) should _not_
     * be used after calling this method.
     */
    destroy() {
        // eslint-disable-next-line no-underscore-dangle
        return this._destroy();
    }
    // --------------------------------------------------------------------------------------------
    // Events
    // --------------------------------------------------------------------------------------------
    /**
     * Adds an event listener to the client.
     * @param eventName - event name, see {@link StreamrClientEvents} for options
     * @param listener - the callback function
     */
    on(eventName, listener) {
        this.eventEmitter.on(eventName, listener);
    }
    /**
     * Adds an event listener to the client that is invoked only once.
     * @param eventName - event name, see {@link StreamrClientEvents} for options
     * @param listener - the callback function
     */
    once(eventName, listener) {
        this.eventEmitter.once(eventName, listener);
    }
    /**
     * Removes an event listener from the client.
     * @param eventName - event name, see {@link StreamrClientEvents} for options
     * @param listener - the callback function to remove
     */
    off(eventName, listener) {
        this.eventEmitter.off(eventName, listener);
    }
}
exports.StreamrClient = StreamrClient;
StreamrClient.generateEthereumAccount = Ethereum_1.generateEthereumAccount;
//# sourceMappingURL=StreamrClient.js.map