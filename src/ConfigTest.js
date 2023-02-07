"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DOCKER_DEV_STORAGE_NODE = exports.ConfigTest = exports.CONFIG_TEST = void 0;
const utils_1 = require("@streamr/utils");
function toNumber(value) {
    return (value !== undefined) ? Number(value) : undefined;
}
const sideChainConfig = {
    name: 'streamr',
    chainId: 8997,
    rpcs: [{
            url: process.env.SIDECHAIN_URL || `http://${process.env.STREAMR_DOCKER_DEV_HOST || '10.200.10.1'}:8546`,
            timeout: toNumber(process.env.TEST_TIMEOUT) ?? 30 * 1000,
        }]
};
/**
 * Streamr client constructor options that work in the test environment
 */
exports.CONFIG_TEST = {
    network: {
        trackers: [
            {
                id: '0xb9e7cEBF7b03AE26458E32a059488386b05798e8',
                ws: `ws://${process.env.STREAMR_DOCKER_DEV_HOST || '127.0.0.1'}:30301`,
                http: `http://${process.env.STREAMR_DOCKER_DEV_HOST || '127.0.0.1'}:30301`
            }, {
                id: '0x0540A3e144cdD81F402e7772C76a5808B71d2d30',
                ws: `ws://${process.env.STREAMR_DOCKER_DEV_HOST || '127.0.0.1'}:30302`,
                http: `http://${process.env.STREAMR_DOCKER_DEV_HOST || '127.0.0.1'}:30302`
            }, {
                id: '0xf2C195bE194a2C91e93Eacb1d6d55a00552a85E2',
                ws: `ws://${process.env.STREAMR_DOCKER_DEV_HOST || '127.0.0.1'}:30303`,
                http: `http://${process.env.STREAMR_DOCKER_DEV_HOST || '127.0.0.1'}:30303`
            }
        ],
        webrtcDisallowPrivateAddresses: false,
        iceServers: []
    },
    contracts: {
        streamRegistryChainAddress: '0x6cCdd5d866ea766f6DF5965aA98DeCCD629ff222',
        streamStorageRegistryChainAddress: '0xd04af489677001444280366Dd0885B03dAaDe71D',
        storageNodeRegistryChainAddress: '0x231b810D98702782963472e1D60a25496999E75D',
        mainChainRPCs: {
            name: 'dev_ethereum',
            chainId: 8995,
            rpcs: [{
                    url: process.env.ETHEREUM_SERVER_URL || `http://${process.env.STREAMR_DOCKER_DEV_HOST || '10.200.10.1'}:8545`,
                    timeout: toNumber(process.env.TEST_TIMEOUT) ?? 30 * 1000
                }]
        },
        streamRegistryChainRPCs: sideChainConfig,
        theGraphUrl: `http://${process.env.STREAMR_DOCKER_DEV_HOST || '10.200.10.1'}:8000/subgraphs/name/streamr-dev/network-contracts`,
    },
    _timeouts: {
        theGraph: {
            timeout: 10 * 1000,
            retryInterval: 500
        },
        storageNode: {
            timeout: 30 * 1000,
            retryInterval: 500
        },
        jsonRpc: {
            timeout: 20 * 1000,
            retryInterval: 500
        },
        httpFetchTimeout: 30 * 1000
    },
    metrics: false
};
/** @deprecated Use CONFIG_TEST */
exports.ConfigTest = exports.CONFIG_TEST;
exports.DOCKER_DEV_STORAGE_NODE = (0, utils_1.toEthereumAddress)('0xde1112f631486CfC759A50196853011528bC5FA0');
//# sourceMappingURL=ConfigTest.js.map