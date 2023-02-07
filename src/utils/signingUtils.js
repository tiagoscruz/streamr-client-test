"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verify = exports.recover = exports.sign = void 0;
const secp256k1_1 = __importDefault(require("secp256k1"));
const sha3_1 = require("sha3");
const utils_1 = require("@streamr/utils");
const SIGN_MAGIC = '\u0019Ethereum Signed Message:\n';
const keccak = new sha3_1.Keccak(256);
/**
 * Contains functions to creates and verifies standard Ethereum signatures.
 * These are a faster implementation than found in ether.js library. They are
 * compatible with e.g. ether.js's verifyMessage and signMessage functions.
 *
 * In Node environment the performance is significantly better compared
 * to ether.js v5.5.0.
 *
 * See test/benchmark/SigningUtils.ts and the original PR:
 * https://github.com/streamr-dev/streamr-client-protocol-js/pull/35
 */
function hash(messageBuffer) {
    const prefixString = SIGN_MAGIC + messageBuffer.length;
    const merged = Buffer.concat([Buffer.from(prefixString, 'utf-8'), messageBuffer]);
    keccak.reset();
    keccak.update(merged);
    return keccak.digest('binary');
}
function recoverPublicKey(signatureBuffer, payloadBuffer) {
    const recoveryId = signatureBuffer.readUInt8(signatureBuffer.length - 1) - 27;
    return secp256k1_1.default.ecdsaRecover(signatureBuffer.subarray(0, signatureBuffer.length - 1), recoveryId, hash(payloadBuffer), false, Buffer.alloc);
}
function normalize(privateKeyOrAddress) {
    return privateKeyOrAddress.startsWith('0x') ? privateKeyOrAddress.substring(2) : privateKeyOrAddress;
}
function sign(payload, privateKey) {
    const payloadBuffer = Buffer.from(payload, 'utf-8');
    const privateKeyBuffer = Buffer.from(normalize(privateKey), 'hex');
    const msgHash = hash(payloadBuffer);
    const sigObj = secp256k1_1.default.ecdsaSign(msgHash, privateKeyBuffer);
    const result = Buffer.alloc(sigObj.signature.length + 1, Buffer.from(sigObj.signature));
    result.writeInt8(27 + sigObj.recid, result.length - 1);
    return '0x' + result.toString('hex');
}
exports.sign = sign;
function recover(signature, payload, publicKeyBuffer = undefined) {
    const signatureBuffer = Buffer.from(normalize(signature), 'hex'); // remove '0x' prefix
    const payloadBuffer = Buffer.from(payload, 'utf-8');
    if (!publicKeyBuffer) {
        publicKeyBuffer = recoverPublicKey(signatureBuffer, payloadBuffer);
    }
    const pubKeyWithoutFirstByte = publicKeyBuffer.subarray(1, publicKeyBuffer.length);
    keccak.reset();
    keccak.update(Buffer.from(pubKeyWithoutFirstByte));
    const hashOfPubKey = keccak.digest('binary');
    return '0x' + hashOfPubKey.subarray(12, hashOfPubKey.length).toString('hex');
}
exports.recover = recover;
function verify(address, payload, signature) {
    try {
        const recoveredAddress = (0, utils_1.toEthereumAddress)(recover(signature, payload));
        return recoveredAddress === address;
    }
    catch (err) {
        return false;
    }
}
exports.verify = verify;
//# sourceMappingURL=signingUtils.js.map