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
exports.Decrypt = void 0;
const protocol_1 = require("@streamr/protocol");
const EncryptionUtil_1 = require("../encryption/EncryptionUtil");
const StreamRegistryCached_1 = require("../registry/StreamRegistryCached");
const DestroySignal_1 = require("../DestroySignal");
const SubscriberKeyExchange_1 = require("../encryption/SubscriberKeyExchange");
const GroupKeyStore_1 = require("../encryption/GroupKeyStore");
const Config_1 = require("../Config");
const tsyringe_1 = require("tsyringe");
const utils_1 = require("@streamr/utils");
const events_1 = require("../events");
const LoggerFactory_1 = require("../utils/LoggerFactory");
let Decrypt = class Decrypt {
    constructor(groupKeyStore, keyExchange, streamRegistryCached, destroySignal, loggerFactory, eventEmitter, config) {
        this.groupKeyStore = groupKeyStore;
        this.keyExchange = keyExchange;
        this.streamRegistryCached = streamRegistryCached;
        this.destroySignal = destroySignal;
        this.eventEmitter = eventEmitter;
        this.config = config;
        this.logger = loggerFactory.createLogger(module);
        this.decrypt = this.decrypt.bind(this);
    }
    // TODO if this.destroySignal.isDestroyed() is true, would it make sense to reject the promise
    // and not to return the original encrypted message?
    // - e.g. StoppedError, which is not visible to end-user
    async decrypt(streamMessage) {
        if (this.destroySignal.isDestroyed()) {
            return streamMessage;
        }
        if (!streamMessage.groupKeyId) {
            return streamMessage;
        }
        if (streamMessage.encryptionType !== protocol_1.EncryptionType.AES) {
            return streamMessage;
        }
        try {
            const groupKeyId = streamMessage.groupKeyId;
            let groupKey = await this.groupKeyStore.get(groupKeyId, streamMessage.getStreamId());
            if (groupKey === undefined) {
                await this.keyExchange.requestGroupKey(streamMessage.groupKeyId, streamMessage.getPublisherId(), streamMessage.getStreamPartID());
                try {
                    const groupKeys = await (0, utils_1.waitForEvent)(
                    // TODO remove "as any" type casing in NET-889
                    this.eventEmitter, 'addGroupKey', this.config.decryption.keyRequestTimeout, (storedGroupKey) => storedGroupKey.id === groupKeyId, this.destroySignal.abortSignal);
                    groupKey = groupKeys[0];
                }
                catch (e) {
                    if (this.destroySignal.isDestroyed()) {
                        return streamMessage;
                    }
                    throw new EncryptionUtil_1.DecryptError(streamMessage, `Could not get GroupKey ${streamMessage.groupKeyId}: ${e.message}`);
                }
                if (this.destroySignal.isDestroyed()) {
                    return streamMessage;
                }
            }
            const clone = protocol_1.StreamMessage.deserialize(streamMessage.serialize());
            EncryptionUtil_1.EncryptionUtil.decryptStreamMessage(clone, groupKey);
            if (streamMessage.newGroupKey) {
                // newGroupKey has been converted into GroupKey
                await this.groupKeyStore.add(clone.newGroupKey, streamMessage.getStreamId());
            }
            return clone;
        }
        catch (err) {
            this.logger.debug('failed to decrypt message %j, reason: %s', streamMessage.getMessageID(), err);
            // clear cached permissions if cannot decrypt, likely permissions need updating
            this.streamRegistryCached.clearStream(streamMessage.getStreamId());
            throw err;
        }
    }
};
Decrypt = __decorate([
    __param(4, (0, tsyringe_1.inject)(LoggerFactory_1.LoggerFactory)),
    __param(5, (0, tsyringe_1.inject)(events_1.StreamrClientEventEmitter)),
    __param(6, (0, tsyringe_1.inject)(Config_1.ConfigInjectionToken)),
    __metadata("design:paramtypes", [GroupKeyStore_1.GroupKeyStore,
        SubscriberKeyExchange_1.SubscriberKeyExchange,
        StreamRegistryCached_1.StreamRegistryCached,
        DestroySignal_1.DestroySignal,
        LoggerFactory_1.LoggerFactory,
        events_1.StreamrClientEventEmitter, Object])
], Decrypt);
exports.Decrypt = Decrypt;
//# sourceMappingURL=Decrypt.js.map