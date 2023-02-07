"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.formLookupKey = exports.generateClientId = exports.MaxSizedSet = exports.formStorageNodeAssignmentStreamId = exports.getEndpointUrl = exports.getVersionString = exports.instanceId = exports.counterId = exports.CounterId = void 0;
const quick_lru_1 = __importDefault(require("../../vendor/quick-lru"));
const uuid_1 = require("./uuid");
const package_json_1 = __importDefault(require("../../package.json"));
const protocol_1 = require("@streamr/protocol");
const utils_1 = require("@streamr/utils");
const CounterId = (rootPrefix, { maxPrefixes = 256 } = {}) => {
    let counts = {}; // possible we could switch this to WeakMap and pass functions or classes.
    let didWarn = false;
    const counterIdFn = (prefix = 'ID', separator = uuid_1.SEPARATOR) => {
        // pedantic: wrap around if count grows too large
        counts[prefix] = (counts[prefix] + 1 || 0) % Number.MAX_SAFE_INTEGER;
        // warn once if too many prefixes
        if (!didWarn) {
            const numTracked = Object.keys(counts).length;
            if (numTracked > maxPrefixes) {
                didWarn = true;
                console.warn(`counterId should not be used for a large number of unique prefixes: ${numTracked} > ${maxPrefixes}`);
            }
        }
        // connect prefix with separator
        return [rootPrefix, prefix, counts[prefix]]
            .filter((v) => v != null) // remove {root}Prefix if not set
            .join(separator);
    };
    /**
     * Clears counts for prefix or all if no prefix supplied.
     *
     * @param {string?} prefix
     */
    counterIdFn.clear = (...args) => {
        // check length to differentiate between clear(undefined) & clear()
        if (args.length) {
            const [prefix] = args;
            delete counts[prefix];
        }
        else {
            // clear all
            counts = {};
        }
    };
    return counterIdFn;
};
exports.CounterId = CounterId;
exports.counterId = (0, exports.CounterId)();
function instanceId(instance, suffix = '') {
    return (0, exports.counterId)(instance.constructor.name) + suffix;
}
exports.instanceId = instanceId;
function getVersion() {
    // dev deps are removed for production build
    const hasDevDependencies = !!(package_json_1.default.devDependencies && Object.keys(package_json_1.default.devDependencies).length);
    const isProduction = process.env.NODE_ENV === 'production' || hasDevDependencies;
    return `${package_json_1.default.version}${!isProduction ? 'dev' : ''}`;
}
// hardcode this at module exec time as can't change
const versionString = getVersion();
function getVersionString() {
    return versionString;
}
exports.getVersionString = getVersionString;
const getEndpointUrl = (baseUrl, ...pathParts) => {
    return baseUrl + '/' + pathParts.map((part) => encodeURIComponent(part)).join('/');
};
exports.getEndpointUrl = getEndpointUrl;
function formStorageNodeAssignmentStreamId(clusterAddress) {
    return (0, protocol_1.toStreamID)('/assignments', (0, utils_1.toEthereumAddress)(clusterAddress));
}
exports.formStorageNodeAssignmentStreamId = formStorageNodeAssignmentStreamId;
class MaxSizedSet {
    constructor(maxSize) {
        this.delegate = new quick_lru_1.default({ maxSize });
    }
    add(value) {
        this.delegate.set(value, true);
    }
    has(value) {
        return this.delegate.has(value);
    }
    delete(value) {
        this.delegate.delete(value);
    }
}
exports.MaxSizedSet = MaxSizedSet;
function generateClientId() {
    return (0, exports.counterId)(process.pid ? `${process.pid}` : (0, utils_1.randomString)(4), '/');
}
exports.generateClientId = generateClientId;
// A unique internal identifier to some list of primitive values. Useful
// e.g. as a map key or a cache key.
const formLookupKey = (...args) => {
    return args.join('|');
};
exports.formLookupKey = formLookupKey;
//# sourceMappingURL=utils.js.map