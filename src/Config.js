"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigInjectionToken = exports.redactConfig = exports.validateConfig = exports.createStrictConfig = exports.STREAM_CLIENT_DEFAULTS = exports.STREAMR_STORAGE_NODE_GERMANY = void 0;
require("reflect-metadata");
const cloneDeep_1 = __importDefault(require("lodash/cloneDeep"));
const ajv_1 = __importDefault(require("ajv"));
const ajv_formats_1 = __importDefault(require("ajv-formats"));
const config_schema_json_1 = __importDefault(require("./config.schema.json"));
const utils_1 = require("./utils/utils");
exports.STREAMR_STORAGE_NODE_GERMANY = '0x31546eEA76F2B2b3C5cC06B1c93601dc35c9D916';
/** @deprecated */
exports.STREAM_CLIENT_DEFAULTS = {
    logLevel: 'info',
    orderMessages: true,
    gapFill: true,
    maxGapRequests: 5,
    retryResendAfter: 5000,
    gapFillTimeout: 5000,
    network: {
        acceptProxyConnections: false,
        trackers: {
            contractAddress: '0xab9BEb0e8B106078c953CcAB4D6bF9142BeF854d'
        },
        trackerPingInterval: 60 * 1000,
        trackerConnectionMaintenanceInterval: 5 * 1000,
        webrtcDisallowPrivateAddresses: true,
        newWebrtcConnectionTimeout: 15 * 1000,
        webrtcDatachannelBufferThresholdLow: 2 ** 15,
        webrtcDatachannelBufferThresholdHigh: 2 ** 17,
        webrtcSendBufferMaxMessageCount: 500,
        disconnectionWaitTime: 200,
        peerPingInterval: 30 * 1000,
        rttUpdateTimeout: 15 * 1000,
        iceServers: [
            {
                url: 'stun:stun.streamr.network',
                port: 5349
            },
            {
                url: 'turn:turn.streamr.network',
                port: 5349,
                username: 'BrubeckTurn1',
                password: 'MIlbgtMw4nhpmbgqRrht1Q=='
            },
            {
                url: 'turn:turn.streamr.network',
                port: 5349,
                username: 'BrubeckTurn1',
                password: 'MIlbgtMw4nhpmbgqRrht1Q==',
                tcp: true
            }
        ]
    },
    // For ethers.js provider params, see https://docs.ethers.io/ethers.js/v5-beta/api-providers.html#provider
    contracts: {
        streamRegistryChainAddress: '0x0D483E10612F327FC11965Fc82E90dC19b141641',
        streamStorageRegistryChainAddress: '0xe8e2660CeDf2a59C917a5ED05B72df4146b58399',
        storageNodeRegistryChainAddress: '0x080F34fec2bc33928999Ea9e39ADc798bEF3E0d6',
        mainChainRPCs: {
            name: 'ethereum',
            chainId: 1,
            rpcs: [
                {
                    url: 'https://eth-rpc.gateway.pokt.network',
                    timeout: 120 * 1000
                },
                {
                    url: 'https://ethereum.publicnode.com',
                    timeout: 120 * 1000
                },
                {
                    url: 'https://rpc.ankr.com/eth',
                    timeout: 120 * 1000
                },
            ]
        },
        streamRegistryChainRPCs: {
            name: 'polygon',
            chainId: 137,
            rpcs: [{
                    url: 'https://polygon-rpc.com',
                    timeout: 120 * 1000
                }, {
                    url: 'https://poly-rpc.gateway.pokt.network/',
                    timeout: 120 * 1000
                }]
        },
        ethereumNetworks: {
            polygon: {
                chainId: 137,
                highGasPriceStrategy: true
            }
        },
        theGraphUrl: 'https://api.thegraph.com/subgraphs/name/streamr-dev/streams',
        maxConcurrentCalls: 10
    },
    decryption: {
        keyRequestTimeout: 30 * 1000,
        maxKeyRequestsPerSecond: 20
    },
    cache: {
        maxSize: 10000,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
    _timeouts: {
        theGraph: {
            timeout: 60 * 1000,
            retryInterval: 1000
        },
        storageNode: {
            timeout: 30 * 1000,
            retryInterval: 1000
        },
        jsonRpc: {
            timeout: 30 * 1000,
            retryInterval: 1000
        },
        httpFetchTimeout: 30 * 1000
    }
};
const createStrictConfig = (input = {}) => {
    // TODO is it good to cloneDeep the input object as it may have object references (e.g. auth.ethereum)?
    const config = (0, exports.validateConfig)((0, cloneDeep_1.default)(input));
    config.id ??= (0, utils_1.generateClientId)();
    return config;
};
exports.createStrictConfig = createStrictConfig;
const validateConfig = (data) => {
    const ajv = new ajv_1.default({
        useDefaults: true
    });
    (0, ajv_formats_1.default)(ajv);
    ajv.addFormat('ethereum-address', /^0x[a-zA-Z0-9]{40}$/);
    ajv.addFormat('ethereum-private-key', /^(0x)?[a-zA-Z0-9]{64}$/);
    const validate = ajv.compile(config_schema_json_1.default);
    if (!validate(data)) {
        throw new Error(validate.errors.map((e) => {
            let text = ajv.errorsText([e], { dataVar: '' }).trim();
            if (e.params.additionalProperty) {
                text += `: ${e.params.additionalProperty}`;
            }
            return text;
        }).join('\n'));
    }
    return data;
};
exports.validateConfig = validateConfig;
const redactConfig = (config) => {
    if (config.auth?.privateKey !== undefined) {
        config.auth.privateKey = '(redacted)';
    }
};
exports.redactConfig = redactConfig;
exports.ConfigInjectionToken = Symbol('Config');
//# sourceMappingURL=Config.js.map