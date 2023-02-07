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
exports.SubscriberKeyExchange = void 0;
const protocol_1 = require("@streamr/protocol");
const tsyringe_1 = require("tsyringe");
const uuid_1 = require("uuid");
const Authentication_1 = require("../Authentication");
const Config_1 = require("../Config");
const NetworkNodeFacade_1 = require("../NetworkNodeFacade");
const messageChain_1 = require("../publish/messageChain");
const MessageFactory_1 = require("../publish/MessageFactory");
const promises_1 = require("../utils/promises");
const utils_1 = require("../utils/utils");
const Validator_1 = require("../Validator");
const GroupKey_1 = require("./GroupKey");
const GroupKeyStore_1 = require("./GroupKeyStore");
const RSAKeyPair_1 = require("./RSAKeyPair");
const LoggerFactory_1 = require("../utils/LoggerFactory");
const MAX_PENDING_REQUEST_COUNT = 50000; // just some limit, we can tweak the number if needed
/*
 * Sends group key requests and receives group key responses
 */
let SubscriberKeyExchange = class SubscriberKeyExchange {
    constructor(networkNodeFacade, store, authentication, validator, loggerFactory, config) {
        this.pendingRequests = new utils_1.MaxSizedSet(MAX_PENDING_REQUEST_COUNT);
        this.logger = loggerFactory.createLogger(module);
        this.networkNodeFacade = networkNodeFacade;
        this.store = store;
        this.authentication = authentication;
        this.validator = validator;
        this.ensureStarted = (0, promises_1.pOnce)(async () => {
            this.rsaKeyPair = await RSAKeyPair_1.RSAKeyPair.create();
            const node = await networkNodeFacade.getNode();
            node.addMessageListener((msg) => this.onMessage(msg));
            this.logger.debug('started');
        });
        this.requestGroupKey = (0, promises_1.withThrottling)((groupKeyId, publisherId, streamPartId) => {
            return this.doRequestGroupKey(groupKeyId, publisherId, streamPartId);
        }, config.decryption.maxKeyRequestsPerSecond);
    }
    async doRequestGroupKey(groupKeyId, publisherId, streamPartId) {
        await this.ensureStarted();
        const requestId = (0, uuid_1.v4)();
        const request = await this.createRequest(groupKeyId, streamPartId, publisherId, this.rsaKeyPair.getPublicKey(), requestId);
        const node = await this.networkNodeFacade.getNode();
        node.publish(request);
        this.pendingRequests.add(requestId);
        this.logger.debug('sent a group key %s with requestId %s to %s', groupKeyId, requestId, publisherId);
    }
    async createRequest(groupKeyId, streamPartId, publisherId, rsaPublicKey, requestId) {
        const requestContent = new protocol_1.GroupKeyRequest({
            recipient: publisherId,
            requestId,
            rsaPublicKey,
            groupKeyIds: [groupKeyId],
        }).toArray();
        return (0, MessageFactory_1.createSignedMessage)({
            messageId: new protocol_1.MessageID(protocol_1.StreamPartIDUtils.getStreamID(streamPartId), protocol_1.StreamPartIDUtils.getStreamPartition(streamPartId), Date.now(), 0, await this.authentication.getAddress(), (0, messageChain_1.createRandomMsgChainId)()),
            serializedContent: JSON.stringify(requestContent),
            messageType: protocol_1.StreamMessageType.GROUP_KEY_REQUEST,
            encryptionType: protocol_1.EncryptionType.NONE,
            authentication: this.authentication
        });
    }
    async onMessage(msg) {
        if (protocol_1.GroupKeyResponse.is(msg)) {
            try {
                const authenticatedUser = await this.authentication.getAddress();
                const { requestId, recipient, encryptedGroupKeys } = protocol_1.GroupKeyResponse.fromStreamMessage(msg);
                if ((recipient === authenticatedUser) && (this.pendingRequests.has(requestId))) {
                    this.logger.debug('handling group key response %s', requestId);
                    this.pendingRequests.delete(requestId);
                    await this.validator.validate(msg);
                    await Promise.all(encryptedGroupKeys.map(async (encryptedKey) => {
                        const key = GroupKey_1.GroupKey.decryptRSAEncrypted(encryptedKey, this.rsaKeyPair.getPrivateKey());
                        await this.store.add(key, msg.getStreamId());
                    }));
                }
            }
            catch (e) {
                this.logger.debug('error handling group key response, reason: %s', e.message);
            }
        }
    }
};
SubscriberKeyExchange = __decorate([
    (0, tsyringe_1.scoped)(tsyringe_1.Lifecycle.ContainerScoped),
    __param(2, (0, tsyringe_1.inject)(Authentication_1.AuthenticationInjectionToken)),
    __param(4, (0, tsyringe_1.inject)(LoggerFactory_1.LoggerFactory)),
    __param(5, (0, tsyringe_1.inject)(Config_1.ConfigInjectionToken)),
    __metadata("design:paramtypes", [NetworkNodeFacade_1.NetworkNodeFacade,
        GroupKeyStore_1.GroupKeyStore, Object, Validator_1.Validator,
        LoggerFactory_1.LoggerFactory, Object])
], SubscriberKeyExchange);
exports.SubscriberKeyExchange = SubscriberKeyExchange;
//# sourceMappingURL=SubscriberKeyExchange.js.map