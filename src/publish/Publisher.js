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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Publisher = void 0;
const tsyringe_1 = require("tsyringe");
const p_limit_1 = __importDefault(require("p-limit"));
const StreamIDBuilder_1 = require("../StreamIDBuilder");
const Authentication_1 = require("../Authentication");
const NetworkNodeFacade_1 = require("../NetworkNodeFacade");
const MessageFactory_1 = require("./MessageFactory");
const lodash_1 = require("lodash");
const StreamRegistryCached_1 = require("../registry/StreamRegistryCached");
const GroupKeyStore_1 = require("../encryption/GroupKeyStore");
const GroupKeyQueue_1 = require("./GroupKeyQueue");
const Mapping_1 = require("../utils/Mapping");
const StreamrClientError_1 = require("../StreamrClientError");
const parseTimestamp = (metadata) => {
    if (metadata?.timestamp === undefined) {
        return Date.now();
    }
    else {
        return metadata.timestamp instanceof Date
            ? metadata.timestamp.getTime()
            : (0, lodash_1.isString)(metadata.timestamp)
                ? new Date(metadata.timestamp).getTime()
                : metadata.timestamp;
    }
};
let Publisher = class Publisher {
    constructor(streamIdBuilder, authentication, streamRegistryCached, groupKeyStore, node) {
        this.concurrencyLimit = (0, p_limit_1.default)(1);
        this.streamIdBuilder = streamIdBuilder;
        this.authentication = authentication;
        this.streamRegistryCached = streamRegistryCached;
        this.node = node;
        this.messageFactories = new Mapping_1.Mapping(async (streamId) => {
            return this.createMessageFactory(streamId);
        });
        this.groupKeyQueues = new Mapping_1.Mapping(async (streamId) => {
            return new GroupKeyQueue_1.GroupKeyQueue(streamId, groupKeyStore);
        });
    }
    async publish(streamDefinition, content, metadata) {
        const timestamp = parseTimestamp(metadata);
        /*
         * There are some steps in the publish process which need to be done sequentially:
         * - message chaining
         * - consuming a group key from a queue
         *
         * It is also good if messages are published to node in the same sequence (within
         * a message chain), as that can avoid unnecessary gap fills: if a subscriber would
         * receive messages m1, m2, m3 in order m1, m3, m2 it would try to get m2 via
         * a gap fill resend before it receives it normally).
         *
         * Currently we limit that there can be only one publish task at any given time.
         * That way message chaining and group keys consuming is done properly. If we want
         * to improve concurrency, we could maybe offload message encryptions to a separate
         * tasks which we'd execute in parallel.
         */
        return this.concurrencyLimit(async () => {
            const [streamId, partition] = await this.streamIdBuilder.toStreamPartElements(streamDefinition);
            try {
                const messageFactory = await this.messageFactories.get(streamId);
                const message = await messageFactory.createMessage(content, {
                    ...metadata,
                    timestamp
                }, partition);
                await this.node.publishToNode(message);
                return message;
            }
            catch (e) {
                const errorCode = (e instanceof StreamrClientError_1.StreamrClientError) ? e.code : 'UNKNOWN_ERROR';
                throw new StreamrClientError_1.StreamrClientError(`Failed to publish to stream ${streamId}. Cause: ${e.message}`, errorCode);
            }
        });
    }
    getGroupKeyQueue(streamId) {
        return this.groupKeyQueues.get(streamId);
    }
    /* eslint-disable @typescript-eslint/no-shadow */
    async createMessageFactory(streamId) {
        return new MessageFactory_1.MessageFactory({
            streamId,
            authentication: this.authentication,
            streamRegistry: this.streamRegistryCached,
            groupKeyQueue: await this.groupKeyQueues.get(streamId)
        });
    }
};
Publisher = __decorate([
    (0, tsyringe_1.scoped)(tsyringe_1.Lifecycle.ContainerScoped),
    __param(1, (0, tsyringe_1.inject)(Authentication_1.AuthenticationInjectionToken)),
    __metadata("design:paramtypes", [StreamIDBuilder_1.StreamIDBuilder, Object, StreamRegistryCached_1.StreamRegistryCached,
        GroupKeyStore_1.GroupKeyStore,
        NetworkNodeFacade_1.NetworkNodeFacade])
], Publisher);
exports.Publisher = Publisher;
//# sourceMappingURL=Publisher.js.map