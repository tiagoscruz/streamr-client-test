"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EncryptionUtil = exports.DecryptError = void 0;
const crypto_1 = __importDefault(require("crypto"));
const bytes_1 = require("@ethersproject/bytes");
const protocol_1 = require("@streamr/protocol");
class DecryptError extends protocol_1.StreamMessageError {
    constructor(streamMessage, message = '') {
        super(`Decrypt error: ${message}`, streamMessage);
    }
}
exports.DecryptError = DecryptError;
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
class EncryptionUtil {
    static validateRSAPublicKey(publicKey) {
        const keyString = typeof publicKey === 'string' ? publicKey : publicKey.toString('utf8');
        if (typeof keyString !== 'string' || !keyString.startsWith('-----BEGIN PUBLIC KEY-----')
            || !keyString.endsWith('-----END PUBLIC KEY-----\n')) {
            throw new Error('"publicKey" must be a PKCS#8 RSA public key in the PEM format');
        }
    }
    static encryptWithRSAPublicKey(plaintextBuffer, publicKey, outputInHex = false) {
        this.validateRSAPublicKey(publicKey);
        const ciphertextBuffer = crypto_1.default.publicEncrypt(publicKey, plaintextBuffer);
        if (outputInHex) {
            return (0, bytes_1.hexlify)(ciphertextBuffer).slice(2);
        }
        return ciphertextBuffer;
    }
    // Returns a Buffer
    static decryptWithRSAPrivateKey(ciphertext, privateKey, isHexString = false) {
        const ciphertextBuffer = isHexString ? (0, bytes_1.arrayify)(`0x${ciphertext}`) : ciphertext;
        return crypto_1.default.privateDecrypt(privateKey, ciphertextBuffer);
    }
    /*
     * Returns a hex string without the '0x' prefix.
     */
    static encryptWithAES(data, cipherKey) {
        const iv = crypto_1.default.randomBytes(16); // always need a fresh IV when using CTR mode
        const cipher = crypto_1.default.createCipheriv('aes-256-ctr', cipherKey, iv);
        return (0, bytes_1.hexlify)(iv).slice(2) + cipher.update(data, undefined, 'hex') + cipher.final('hex');
    }
    /*
     * 'ciphertext' must be a hex string (without '0x' prefix), 'groupKey' must be a GroupKey. Returns a Buffer.
     */
    static decryptWithAES(ciphertext, cipherKey) {
        const iv = (0, bytes_1.arrayify)(`0x${ciphertext.slice(0, 32)}`);
        const decipher = crypto_1.default.createDecipheriv('aes-256-ctr', cipherKey, iv);
        return Buffer.concat([decipher.update(ciphertext.slice(32), 'hex'), decipher.final()]);
    }
    static decryptStreamMessage(streamMessage, groupKey) {
        if ((streamMessage.encryptionType !== protocol_1.EncryptionType.AES)) {
            return;
        }
        try {
            streamMessage.encryptionType = protocol_1.EncryptionType.NONE;
            const serializedContent = this.decryptWithAES(streamMessage.getSerializedContent(), groupKey.data).toString();
            streamMessage.parsedContent = JSON.parse(serializedContent);
            streamMessage.serializedContent = serializedContent;
        }
        catch (err) {
            streamMessage.encryptionType = protocol_1.EncryptionType.AES;
            throw new DecryptError(streamMessage, err.stack);
        }
        try {
            const { newGroupKey } = streamMessage;
            if (newGroupKey) {
                // newGroupKey should be EncryptedGroupKey | GroupKey, but GroupKey is not defined in protocol
                // @ts-expect-error expecting EncryptedGroupKey
                streamMessage.newGroupKey = groupKey.decryptNextGroupKey(newGroupKey);
            }
        }
        catch (err) {
            streamMessage.encryptionType = protocol_1.EncryptionType.AES;
            throw new DecryptError(streamMessage, 'Could not decrypt new group key: ' + err.stack);
        }
        /* eslint-enable no-param-reassign */
    }
}
exports.EncryptionUtil = EncryptionUtil;
//# sourceMappingURL=EncryptionUtil.js.map