"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAuthentication = exports.createPrivateKeyAuthentication = exports.AuthenticationInjectionToken = void 0;
const wallet_1 = require("@ethersproject/wallet");
const providers_1 = require("@ethersproject/providers");
const transactions_1 = require("@ethersproject/transactions");
const Ethereum_1 = require("./Ethereum");
const promises_1 = require("./utils/promises");
const p_memoize_1 = __importDefault(require("p-memoize"));
const utils_1 = require("@streamr/utils");
const signingUtils_1 = require("./utils/signingUtils");
exports.AuthenticationInjectionToken = Symbol('Authentication');
const createPrivateKeyAuthentication = (key, config) => {
    const address = (0, utils_1.toEthereumAddress)((0, transactions_1.computeAddress)(key));
    return {
        getAddress: async () => address,
        createMessageSignature: async (payload) => (0, signingUtils_1.sign)(payload, key),
        getStreamRegistryChainSigner: async () => new wallet_1.Wallet(key, (0, Ethereum_1.getStreamRegistryChainProvider)(config))
    };
};
exports.createPrivateKeyAuthentication = createPrivateKeyAuthentication;
const createAuthentication = (config) => {
    if (config.auth?.privateKey !== undefined) {
        const privateKey = config.auth.privateKey;
        const normalizedPrivateKey = !privateKey.startsWith('0x')
            ? `0x${privateKey}`
            : privateKey;
        return (0, exports.createPrivateKeyAuthentication)(normalizedPrivateKey, config);
    }
    else if (config.auth?.ethereum !== undefined) {
        const ethereum = config.auth?.ethereum;
        const provider = new providers_1.Web3Provider(ethereum);
        const signer = provider.getSigner();
        return {
            getAddress: (0, p_memoize_1.default)(async () => {
                try {
                    if (!('request' in ethereum && typeof ethereum.request === 'function')) {
                        throw new Error(`invalid ethereum provider ${ethereum}`);
                    }
                    const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
                    return (0, utils_1.toEthereumAddress)(accounts[0]);
                }
                catch {
                    throw new Error('no addresses connected and selected in the custom authentication provider');
                }
            }),
            createMessageSignature: (0, promises_1.pLimitFn)(async (payload) => {
                // sign one at a time & wait a moment before asking for next signature
                // otherwise MetaMask extension may not show the prompt window
                const sig = await signer.signMessage(payload);
                await (0, utils_1.wait)(50);
                return sig;
            }, 1),
            getStreamRegistryChainSigner: async () => {
                if (config.contracts.streamRegistryChainRPCs.chainId === undefined) {
                    throw new Error('Streamr streamRegistryChainRPC not configured (with chainId) in the StreamrClient options!');
                }
                const { chainId } = await provider.getNetwork();
                if (chainId !== config.contracts.streamRegistryChainRPCs.chainId) {
                    const sideChainId = config.contracts.streamRegistryChainRPCs.chainId;
                    throw new Error(
                    // eslint-disable-next-line max-len
                    `Please connect the custom authentication provider to Ethereum blockchain with chainId ${sideChainId}: current chainId is ${chainId}`);
                }
                return signer;
                // TODO: handle events
                // ethereum.on('accountsChanged', (accounts) => { })
                // https://docs.metamask.io/guide/ethereum-provider.html#events says:
                //   "We recommend reloading the page unless you have a very good reason not to"
                //   Of course we can't and won't do that, but if we need something chain-dependent...
                // ethereum.on('chainChanged', (chainId) => { window.location.reload() });
            }
        };
    }
    else {
        return (0, exports.createPrivateKeyAuthentication)(wallet_1.Wallet.createRandom().privateKey, config);
    }
};
exports.createAuthentication = createAuthentication;
//# sourceMappingURL=Authentication.js.map