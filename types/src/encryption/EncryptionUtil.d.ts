/// <reference types="node" />
/// <reference types="node" />
import crypto, { CipherKey } from 'crypto';
import { StreamMessage, StreamMessageError } from '@streamr/protocol';
import { GroupKey } from './GroupKey';
export declare class DecryptError extends StreamMessageError {
    constructor(streamMessage: StreamMessage, message?: string);
}
export declare class EncryptionUtil {
    private static validateRSAPublicKey;
    /**
     * Returns a Buffer or a hex String
     */
    static encryptWithRSAPublicKey(plaintextBuffer: Uint8Array, publicKey: crypto.KeyLike, outputInHex: true): string;
    static encryptWithRSAPublicKey(plaintextBuffer: Uint8Array, publicKey: crypto.KeyLike): string;
    static encryptWithRSAPublicKey(plaintextBuffer: Uint8Array, publicKey: crypto.KeyLike, outputInHex: false): Buffer;
    static decryptWithRSAPrivateKey(ciphertext: string | Uint8Array, privateKey: crypto.KeyLike, isHexString?: boolean): Buffer;
    static encryptWithAES(data: Uint8Array, cipherKey: CipherKey): string;
    static decryptWithAES(ciphertext: string, cipherKey: CipherKey): Buffer;
    static decryptStreamMessage(streamMessage: StreamMessage, groupKey: GroupKey): void | never;
}
