"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStreamRegistryOverrides = exports.getAllStreamRegistryChainProviders = exports.getStreamRegistryChainProvider = exports.getMainnetProvider = exports.generateEthereumAccount = void 0;
/**
 * Config and utilities for interating with identity & Ethereum chain.
 */
const wallet_1 = require("@ethersproject/wallet");
const providers_1 = require("@ethersproject/providers");
const generateEthereumAccount = () => {
    const wallet = wallet_1.Wallet.createRandom();
    return {
        address: wallet.address,
        privateKey: wallet.privateKey,
    };
};
exports.generateEthereumAccount = generateEthereumAccount;
// TODO maybe we should use all providers?
const getMainnetProvider = (config) => {
    const providers = getRpcProviders(config.contracts.mainChainRPCs);
    return providers[0];
};
exports.getMainnetProvider = getMainnetProvider;
const getStreamRegistryChainProvider = (config) => {
    return (0, exports.getAllStreamRegistryChainProviders)(config)[0];
};
exports.getStreamRegistryChainProvider = getStreamRegistryChainProvider;
const getAllStreamRegistryChainProviders = (config) => {
    return getRpcProviders(config.contracts.streamRegistryChainRPCs);
};
exports.getAllStreamRegistryChainProviders = getAllStreamRegistryChainProviders;
const getRpcProviders = (connectionInfo) => {
    return connectionInfo.rpcs.map((c) => {
        return new providers_1.JsonRpcProvider(c);
    });
};
const getStreamRegistryOverrides = (config) => {
    return getOverrides(config.contracts.streamRegistryChainRPCs.name ?? 'polygon', (0, exports.getStreamRegistryChainProvider)(config), config);
};
exports.getStreamRegistryOverrides = getStreamRegistryOverrides;
/**
 * Apply the gasPriceStrategy to the estimated gas price, if given
 * Ethers.js will resolve the gas price promise before sending the tx
 */
const getOverrides = (chainName, provider, config) => {
    const chainConfig = config.contracts.ethereumNetworks[chainName];
    if (chainConfig === undefined) {
        return {};
    }
    const overrides = chainConfig.overrides ?? {};
    const gasPriceStrategy = chainConfig.highGasPriceStrategy
        ? (estimatedGasPrice) => estimatedGasPrice.add('10000000000')
        : chainConfig.gasPriceStrategy;
    if (gasPriceStrategy !== undefined) {
        return {
            ...overrides,
            gasPrice: provider.getGasPrice().then(gasPriceStrategy)
        };
    }
    return overrides;
};
//# sourceMappingURL=Ethereum.js.map