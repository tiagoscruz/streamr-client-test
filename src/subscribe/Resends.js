"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Resends = void 0;
const tsyringe_1 = require("tsyringe");
const protocol_1 = require("@streamr/protocol");
const MessageStream_1 = require("./MessageStream");
const subscribePipeline_1 = require("./subscribePipeline");
const StorageNodeRegistry_1 = require("../registry/StorageNodeRegistry");
const lodash_1 = require("lodash");
const Config_1 = require("../Config");
const HttpUtil_1 = require("../HttpUtil");
const StreamStorageRegistry_1 = require("../registry/StreamStorageRegistry");
const utils_1 = require("@streamr/utils");
const GroupKeyStore_1 = require("../encryption/GroupKeyStore");
const SubscriberKeyExchange_1 = require("../encryption/SubscriberKeyExchange");
const events_1 = require("../events");
const DestroySignal_1 = require("../DestroySignal");
const StreamRegistryCached_1 = require("../registry/StreamRegistryCached");
const LoggerFactory_1 = require("../utils/LoggerFactory");
const utils_2 = require("../utils/utils");
const StreamrClientError_1 = require("../StreamrClientError");
const iterators_1 = require("../utils/iterators");
const GeneratorUtils_1 = require("../utils/GeneratorUtils");
const MIN_SEQUENCE_NUMBER_VALUE = 0;
function isResendLast(options) {
    return options && typeof options === 'object' && 'last' in options && options.last != null;
}
function isResendFrom(options) {
    return options && typeof options === 'object' && 'from' in options && !('to' in options) && options.from != null;
}
function isResendRange(options) {
    return options && typeof options === 'object' && 'from' in options && 'to' in options && options.to && options.from != null;
}
let Resends = class Resends {
    constructor(streamStorageRegistry, storageNodeRegistry, streamRegistryCached, httpUtil, groupKeyStore, subscriberKeyExchange, streamrClientEventEmitter, destroySignal, config, loggerFactory) {
        this.streamStorageRegistry = streamStorageRegistry;
        this.storageNodeRegistry = storageNodeRegistry;
        this.streamRegistryCached = streamRegistryCached;
        this.httpUtil = httpUtil;
        this.groupKeyStore = groupKeyStore;
        this.subscriberKeyExchange = subscriberKeyExchange;
        this.streamrClientEventEmitter = streamrClientEventEmitter;
        this.destroySignal = destroySignal;
        this.config = config;
        this.loggerFactory = loggerFactory;
        this.logger = loggerFactory.createLogger(module);
    }
    resend(streamPartId, options) {
        if (isResendLast(options)) {
            return this.last(streamPartId, {
                count: options.last,
            });
        }
        if (isResendRange(options)) {
            return this.range(streamPartId, {
                fromTimestamp: new Date(options.from.timestamp).getTime(),
                fromSequenceNumber: options.from.sequenceNumber,
                toTimestamp: new Date(options.to.timestamp).getTime(),
                toSequenceNumber: options.to.sequenceNumber,
                publisherId: options.publisherId !== undefined ? (0, utils_1.toEthereumAddress)(options.publisherId) : undefined,
                msgChainId: options.msgChainId,
            });
        }
        if (isResendFrom(options)) {
            return this.from(streamPartId, {
                fromTimestamp: new Date(options.from.timestamp).getTime(),
                fromSequenceNumber: options.from.sequenceNumber,
                publisherId: options.publisherId !== undefined ? (0, utils_1.toEthereumAddress)(options.publisherId) : undefined,
            });
        }
        throw new StreamrClientError_1.StreamrClientError(`can not resend without valid resend options: ${JSON.stringify({ streamPartId, options })}`, 'INVALID_ARGUMENT');
    }
    async fetchStream(endpointSuffix, streamPartId, query = {}) {
        const loggerIdx = (0, utils_2.counterId)('fetchStream');
        this.logger.debug('[%s] fetching resend %s for %s with options %o', loggerIdx, endpointSuffix, streamPartId, query);
        const streamId = protocol_1.StreamPartIDUtils.getStreamID(streamPartId);
        const nodeAddresses = await this.streamStorageRegistry.getStorageNodes(streamId);
        if (!nodeAddresses.length) {
            throw new StreamrClientError_1.StreamrClientError(`no storage assigned: ${streamId}`, 'NO_STORAGE_NODES');
        }
        const nodeAddress = nodeAddresses[(0, lodash_1.random)(0, nodeAddresses.length - 1)];
        const nodeUrl = (await this.storageNodeRegistry.getStorageNodeMetadata(nodeAddress)).http;
        const url = this.createUrl(nodeUrl, endpointSuffix, streamPartId, query);
        const messageStream = (0, subscribePipeline_1.createSubscribePipeline)({
            streamPartId,
            resends: this,
            groupKeyStore: this.groupKeyStore,
            subscriberKeyExchange: this.subscriberKeyExchange,
            streamRegistryCached: this.streamRegistryCached,
            streamrClientEventEmitter: this.streamrClientEventEmitter,
            destroySignal: this.destroySignal,
            config: this.config,
            loggerFactory: this.loggerFactory
        });
        const dataStream = this.httpUtil.fetchHttpStream(url);
        messageStream.pull((0, GeneratorUtils_1.counting)(dataStream, (count) => {
            this.logger.debug('[%s] total of %d messages received for resend fetch', loggerIdx, count);
        }));
        return messageStream;
    }
    async last(streamPartId, { count }) {
        if (count <= 0) {
            const emptyStream = new MessageStream_1.MessageStream();
            emptyStream.endWrite();
            return emptyStream;
        }
        return this.fetchStream('last', streamPartId, {
            count,
        });
    }
    async from(streamPartId, { fromTimestamp, fromSequenceNumber = MIN_SEQUENCE_NUMBER_VALUE, publisherId }) {
        return this.fetchStream('from', streamPartId, {
            fromTimestamp,
            fromSequenceNumber,
            publisherId,
        });
    }
    async range(streamPartId, { fromTimestamp, fromSequenceNumber = MIN_SEQUENCE_NUMBER_VALUE, toTimestamp, toSequenceNumber = MIN_SEQUENCE_NUMBER_VALUE, publisherId, msgChainId }) {
        return this.fetchStream('range', streamPartId, {
            fromTimestamp,
            fromSequenceNumber,
            toTimestamp,
            toSequenceNumber,
            publisherId,
            msgChainId,
        });
    }
    async waitForStorage(message, { 
    // eslint-disable-next-line no-underscore-dangle
    interval = this.config._timeouts.storageNode.retryInterval, 
    // eslint-disable-next-line no-underscore-dangle
    timeout = this.config._timeouts.storageNode.timeout, count = 100, messageMatchFn = (msgTarget, msgGot) => {
        return msgTarget.signature === msgGot.signature;
    } } = {}) {
        if (!message) {
            throw new StreamrClientError_1.StreamrClientError('waitForStorage requires a Message', 'INVALID_ARGUMENT');
        }
        const start = Date.now();
        let last;
        let found = false;
        while (!found) {
            const duration = Date.now() - start;
            if (duration > timeout) {
                this.logger.debug('timed out waiting for storage to have message %j', {
                    expected: message.streamMessage.getMessageID(),
                    lastReceived: last?.map((l) => l.streamMessage.getMessageID()),
                });
                throw new Error(`timed out after ${duration}ms waiting for message`);
            }
            const resendStream = await this.resend((0, protocol_1.toStreamPartID)(message.streamId, message.streamPartition), { last: count });
            last = await (0, iterators_1.collect)(resendStream);
            for (const lastMsg of last) {
                if (messageMatchFn(message, lastMsg)) {
                    found = true;
                    this.logger.debug('message found');
                    return;
                }
            }
            this.logger.debug('message not found, retrying... %j', {
                msg: message.streamMessage.getMessageID(),
                'last 3': last.slice(-3).map((l) => l.streamMessage.getMessageID())
            });
            await (0, utils_1.wait)(interval);
        }
        /* eslint-enable no-await-in-loop */
    }
    createUrl(baseUrl, endpointSuffix, streamPartId, query = {}) {
        const queryMap = {
            ...query,
            format: 'raw'
        };
        const [streamId, streamPartition] = protocol_1.StreamPartIDUtils.getStreamIDAndPartition(streamPartId);
        const queryString = this.httpUtil.createQueryString(queryMap);
        return `${baseUrl}/streams/${encodeURIComponent(streamId)}/data/partitions/${streamPartition}/${endpointSuffix}?${queryString}`;
    }
};
Resends = __decorate([
    (0, tsyringe_1.scoped)(tsyringe_1.Lifecycle.ContainerScoped),
    __param(1, (0, tsyringe_1.inject)((0, tsyringe_1.delay)(() => StorageNodeRegistry_1.StorageNodeRegistry))),
    __param(2, (0, tsyringe_1.inject)((0, tsyringe_1.delay)(() => StreamRegistryCached_1.StreamRegistryCached))),
    __param(8, (0, tsyringe_1.inject)(Config_1.ConfigInjectionToken)),
    __metadata("design:paramtypes", [StreamStorageRegistry_1.StreamStorageRegistry,
        StorageNodeRegistry_1.StorageNodeRegistry,
        StreamRegistryCached_1.StreamRegistryCached,
        HttpUtil_1.HttpUtil,
        GroupKeyStore_1.GroupKeyStore,
        SubscriberKeyExchange_1.SubscriberKeyExchange,
        events_1.StreamrClientEventEmitter,
        DestroySignal_1.DestroySignal, Object, LoggerFactory_1.LoggerFactory])
], Resends);
exports.Resends = Resends;
//# sourceMappingURL=Resends.js.map