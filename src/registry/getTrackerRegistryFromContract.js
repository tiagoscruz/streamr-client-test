"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTrackerRegistryFromContract = void 0;
const contracts_1 = require("@ethersproject/contracts");
const protocol_1 = require("@streamr/protocol");
const trackerRegistryConfig = __importStar(require("../ethereumArtifacts/TrackerRegistry.json"));
async function fetchTrackers(contractAddress, jsonRpcProvider) {
    // check that provider is connected and has some valid blockNumber
    await jsonRpcProvider.getBlockNumber();
    const contract = new contracts_1.Contract(contractAddress, trackerRegistryConfig.abi, jsonRpcProvider);
    // check that contract is connected
    await contract.addressPromise;
    if (typeof contract.getNodes !== 'function') {
        throw Error(`getNodes function is not defined in smart contract (${contractAddress})`);
    }
    return contract.getNodes();
}
async function getTrackerRegistryFromContract({ contractAddress, jsonRpcProvider }) {
    const trackers = await fetchTrackers(contractAddress, jsonRpcProvider);
    const records = [];
    for (let i = 0; i < trackers.length; ++i) {
        const { metadata, url, nodeAddress } = trackers[i];
        try {
            // The field is tracker.metadata in newer contracts and tracker.url in old contracts.
            // It's safe to clean up tracker.url when no such contract is used anymore.
            const urls = JSON.parse(metadata || url);
            records.push({
                id: nodeAddress,
                ...urls
            });
        }
        catch (e) {
            throw new Error(`Element trackers[${i}] not parsable as object: ${trackers[i]}`);
        }
    }
    return (0, protocol_1.createTrackerRegistry)(records);
}
exports.getTrackerRegistryFromContract = getTrackerRegistryFromContract;
//# sourceMappingURL=getTrackerRegistryFromContract.js.map