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
exports.PublisherKeyExchange = void 0;
const lodash_1 = require("lodash");
const protocol_1 = require("@streamr/protocol");
const tsyringe_1 = require("tsyringe");
const Authentication_1 = require("../Authentication");
const NetworkNodeFacade_1 = require("../NetworkNodeFacade");
const messageChain_1 = require("../publish/messageChain");
const MessageFactory_1 = require("../publish/MessageFactory");
const Validator_1 = require("../Validator");
const EncryptionUtil_1 = require("./EncryptionUtil");
const GroupKeyStore_1 = require("./GroupKeyStore");
const LoggerFactory_1 = require("../utils/LoggerFactory");
/*
 * Sends group key responses
 */
let PublisherKeyExchange = class PublisherKeyExchange {
    constructor(store, networkNodeFacade, loggerFactory, authentication, validator) {
        this.logger = loggerFactory.createLogger(module);
        this.store = store;
        this.networkNodeFacade = networkNodeFacade;
        this.authentication = authentication;
        this.validator = validator;
        networkNodeFacade.once('start', async () => {
            const node = await networkNodeFacade.getNode();
            node.addMessageListener((msg) => this.onMessage(msg));
            this.logger.debug('started');
        });
    }
    async onMessage(request) {
        if (protocol_1.GroupKeyRequest.is(request)) {
            try {
                const authenticatedUser = await this.authentication.getAddress();
                const { recipient, requestId, rsaPublicKey, groupKeyIds } = protocol_1.GroupKeyRequest.fromStreamMessage(request);
                if (recipient === authenticatedUser) {
                    this.logger.debug('handling group key request %s', requestId);
                    await this.validator.validate(request);
                    const keys = (0, lodash_1.without)(await Promise.all(groupKeyIds.map((id) => this.store.get(id, request.getStreamId()))), undefined);
                    if (keys.length > 0) {
                        const response = await this.createResponse(keys, request.getStreamPartID(), rsaPublicKey, request.getPublisherId(), requestId);
                        const node = await this.networkNodeFacade.getNode();
                        node.publish(response);
                        this.logger.debug('sent group keys %s to %s', keys.map((k) => k.id).join(), request.getPublisherId());
                    }
                    else {
                        this.logger.debug('found no group keys to send to %s', request.getPublisherId());
                    }
                }
            }
            catch (e) {
                this.logger.debug('error processing group key, reason: %s', e.message);
            }
        }
    }
    async createResponse(keys, streamPartId, rsaPublicKey, recipient, requestId) {
        const encryptedGroupKeys = await Promise.all(keys.map((key) => {
            const encryptedGroupKeyHex = EncryptionUtil_1.EncryptionUtil.encryptWithRSAPublicKey(key.data, rsaPublicKey, true);
            return new protocol_1.EncryptedGroupKey(key.id, encryptedGroupKeyHex);
        }));
        const responseContent = new protocol_1.GroupKeyResponse({
            recipient,
            requestId,
            encryptedGroupKeys
        });
        const response = (0, MessageFactory_1.createSignedMessage)({
            messageId: new protocol_1.MessageID(protocol_1.StreamPartIDUtils.getStreamID(streamPartId), protocol_1.StreamPartIDUtils.getStreamPartition(streamPartId), Date.now(), 0, await this.authentication.getAddress(), (0, messageChain_1.createRandomMsgChainId)()),
            serializedContent: JSON.stringify(responseContent.toArray()),
            messageType: protocol_1.StreamMessageType.GROUP_KEY_RESPONSE,
            encryptionType: protocol_1.EncryptionType.RSA,
            authentication: this.authentication
        });
        return response;
    }
};
PublisherKeyExchange = __decorate([
    (0, tsyringe_1.scoped)(tsyringe_1.Lifecycle.ContainerScoped),
    __param(2, (0, tsyringe_1.inject)(LoggerFactory_1.LoggerFactory)),
    __param(3, (0, tsyringe_1.inject)(Authentication_1.AuthenticationInjectionToken)),
    __metadata("design:paramtypes", [GroupKeyStore_1.GroupKeyStore,
        NetworkNodeFacade_1.NetworkNodeFacade,
        LoggerFactory_1.LoggerFactory, Object, Validator_1.Validator])
], PublisherKeyExchange);
exports.PublisherKeyExchange = PublisherKeyExchange;
//# sourceMappingURL=PublisherKeyExchange.js.map