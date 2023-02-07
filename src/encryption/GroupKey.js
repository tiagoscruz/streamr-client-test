"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GroupKey = exports.GroupKeyError = void 0;
const crypto_1 = __importDefault(require("crypto"));
const protocol_1 = require("@streamr/protocol");
const uuid_1 = require("../utils/uuid");
const EncryptionUtil_1 = require("./EncryptionUtil");
class GroupKeyError extends Error {
    constructor(message, groupKey) {
        super(message);
        this.groupKey = groupKey;
    }
}
exports.GroupKeyError = GroupKeyError;
/**
 * GroupKeys are AES cipher keys, which are used to encrypt/decrypt StreamMessages (when encryptionType is AES).
 * Each group key contains 256 random bits of key data and an UUID.
 */
class GroupKey {
    constructor(groupKeyId, data) {
        this.id = groupKeyId;
        if (!groupKeyId) {
            throw new GroupKeyError(`groupKeyId must not be falsey ${groupKeyId}`);
        }
        if (!data) {
            throw new GroupKeyError(`groupKeyBufferOrHexString must not be falsey ${data}`);
        }
        this.data = data;
        GroupKey.validate(this);
    }
    static validate(maybeGroupKey) {
        if (!maybeGroupKey) {
            throw new GroupKeyError(`value must be a ${this.name}: ${maybeGroupKey}`, maybeGroupKey);
        }
        if (!(maybeGroupKey instanceof this)) {
            throw new GroupKeyError(`value must be a ${this.name}: ${maybeGroupKey}`, maybeGroupKey);
        }
        if (!maybeGroupKey.id || typeof maybeGroupKey.id !== 'string') {
            throw new GroupKeyError(`${this.name} id must be a string: ${maybeGroupKey}`, maybeGroupKey);
        }
        if (maybeGroupKey.id.includes('---BEGIN')) {
            throw new GroupKeyError(`${this.name} public/private key is not a valid group key id: ${maybeGroupKey}`, maybeGroupKey);
        }
        if (!maybeGroupKey.data || !Buffer.isBuffer(maybeGroupKey.data)) {
            throw new GroupKeyError(`${this.name} data must be a Buffer: ${maybeGroupKey}`, maybeGroupKey);
        }
        if (maybeGroupKey.data.length !== 32) {
            throw new GroupKeyError(`Group key must have a size of 256 bits, not ${maybeGroupKey.data.length * 8}`, maybeGroupKey);
        }
    }
    static generate(id = (0, uuid_1.uuid)('GroupKey')) {
        const keyBytes = crypto_1.default.randomBytes(32);
        return new GroupKey(id, keyBytes);
    }
    /** @internal */
    encryptNextGroupKey(nextGroupKey) {
        return new protocol_1.EncryptedGroupKey(nextGroupKey.id, EncryptionUtil_1.EncryptionUtil.encryptWithAES(nextGroupKey.data, this.data));
    }
    /** @internal */
    decryptNextGroupKey(nextGroupKey) {
        return new GroupKey(nextGroupKey.groupKeyId, EncryptionUtil_1.EncryptionUtil.decryptWithAES(nextGroupKey.encryptedGroupKeyHex, this.data));
    }
    /** @internal */
    static decryptRSAEncrypted(encryptedKey, rsaPrivateKey) {
        return new GroupKey(encryptedKey.groupKeyId, EncryptionUtil_1.EncryptionUtil.decryptWithRSAPrivateKey(encryptedKey.encryptedGroupKeyHex, rsaPrivateKey, true));
    }
}
exports.GroupKey = GroupKey;
//# sourceMappingURL=GroupKey.js.map