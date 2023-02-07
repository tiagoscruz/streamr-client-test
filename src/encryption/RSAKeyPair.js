"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RSAKeyPair = void 0;
const crypto_1 = __importDefault(require("crypto"));
const util_1 = require("util");
const { webcrypto } = crypto_1.default;
function getSubtle() {
    const subtle = typeof window !== 'undefined' ? window?.crypto?.subtle : webcrypto.subtle;
    if (!subtle) {
        const url = 'https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto';
        throw new Error(`SubtleCrypto not supported. This feature is available only in secure contexts (HTTPS) & Node 16+. ${url}`);
    }
    return subtle;
}
function ab2str(...args) {
    // @ts-expect-error Uint8Array parameters
    return String.fromCharCode.apply(null, new Uint8Array(...args));
}
// shim browser btoa for node
function btoa(str) {
    if (global.btoa) {
        return global.btoa(str);
    }
    let buffer;
    if (Buffer.isBuffer(str)) {
        buffer = str;
    }
    else {
        buffer = Buffer.from(str.toString(), 'binary');
    }
    return buffer.toString('base64');
}
async function exportCryptoKey(key, { isPrivate = false } = {}) {
    const keyType = isPrivate ? 'pkcs8' : 'spki';
    const exported = await getSubtle().exportKey(keyType, key);
    const exportedAsString = ab2str(exported);
    const exportedAsBase64 = btoa(exportedAsString);
    const TYPE = isPrivate ? 'PRIVATE' : 'PUBLIC';
    return `-----BEGIN ${TYPE} KEY-----\n${exportedAsBase64}\n-----END ${TYPE} KEY-----\n`;
}
class RSAKeyPair {
    constructor(privateKey, publicKey) {
        this.privateKey = privateKey;
        this.publicKey = publicKey;
    }
    getPublicKey() {
        return this.publicKey;
    }
    getPrivateKey() {
        return this.privateKey;
    }
    static async create() {
        return (typeof window !== 'undefined')
            ? RSAKeyPair.create_browserEnvironment()
            : RSAKeyPair.create_serverEnvironment();
    }
    static async create_serverEnvironment() {
        // promisify here to work around browser/server packaging
        const generateKeyPair = (0, util_1.promisify)(crypto_1.default.generateKeyPair);
        const { publicKey, privateKey } = await generateKeyPair('rsa', {
            modulusLength: 4096,
            publicKeyEncoding: {
                type: 'spki',
                format: 'pem',
            },
            privateKeyEncoding: {
                type: 'pkcs8',
                format: 'pem',
            },
        });
        return new RSAKeyPair(privateKey, publicKey);
    }
    static async create_browserEnvironment() {
        const { publicKey, privateKey } = await getSubtle().generateKey({
            name: 'RSA-OAEP',
            modulusLength: 4096,
            publicExponent: new Uint8Array([1, 0, 1]),
            hash: 'SHA-256'
        }, true, ['encrypt', 'decrypt']);
        const [exportedPrivate, exportedPublic] = await Promise.all([
            exportCryptoKey(privateKey, {
                isPrivate: true,
            }),
            exportCryptoKey(publicKey, {
                isPrivate: false,
            })
        ]);
        return new RSAKeyPair(exportedPrivate, exportedPublic);
    }
}
exports.RSAKeyPair = RSAKeyPair;
//# sourceMappingURL=RSAKeyPair.js.map