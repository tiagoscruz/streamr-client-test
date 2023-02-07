"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageNodeRegistry = void 0;
const NodeRegistryAbi_json_1 = __importDefault(require("../ethereumArtifacts/NodeRegistryAbi.json"));
const tsyringe_1 = require("tsyringe");
const Config_1 = require("../Config");
const Ethereum_1 = require("../Ethereum");
const HttpUtil_1 = require("../HttpUtil");
const contract_1 = require("../utils/contract");
const Authentication_1 = require("../Authentication");
const ContractFactory_1 = require("../ContractFactory");
const utils_1 = require("@streamr/utils");
/**
 * Store a mapping of storage node addresses <-> storage node URLs
 */
let StorageNodeRegistry = class StorageNodeRegistry {
    constructor(contractFactory, authentication, config) {
        this.contractFactory = contractFactory;
        this.authentication = authentication;
        this.config = config;
        const chainProvider = (0, Ethereum_1.getStreamRegistryChainProvider)(config);
        this.nodeRegistryContractReadonly = this.contractFactory.createReadContract((0, utils_1.toEthereumAddress)(this.config.contracts.storageNodeRegistryChainAddress), NodeRegistryAbi_json_1.default, chainProvider, 'storageNodeRegistry');
    }
    async connectToContract() {
        if (!this.nodeRegistryContract) {
            const chainSigner = await this.authentication.getStreamRegistryChainSigner();
            this.nodeRegistryContract = this.contractFactory.createWriteContract((0, utils_1.toEthereumAddress)(this.config.contracts.storageNodeRegistryChainAddress), NodeRegistryAbi_json_1.default, chainSigner, 'storageNodeRegistry');
        }
    }
    async setStorageNodeMetadata(metadata) {
        await this.connectToContract();
        const ethersOverrides = (0, Ethereum_1.getStreamRegistryOverrides)(this.config);
        if (metadata !== undefined) {
            await (0, contract_1.waitForTx)(this.nodeRegistryContract.createOrUpdateNodeSelf(JSON.stringify(metadata), ethersOverrides));
        }
        else {
            await (0, contract_1.waitForTx)(this.nodeRegistryContract.removeNodeSelf(ethersOverrides));
        }
    }
    async getStorageNodeMetadata(nodeAddress) {
        const [resultNodeAddress, metadata] = await this.nodeRegistryContractReadonly.getNode(nodeAddress);
        const NODE_NOT_FOUND = '0x0000000000000000000000000000000000000000';
        if (resultNodeAddress !== NODE_NOT_FOUND) {
            return JSON.parse(metadata);
        }
        else {
            throw new HttpUtil_1.NotFoundError('Node not found, id: ' + nodeAddress);
        }
    }
};
StorageNodeRegistry = __decorate([
    (0, tsyringe_1.scoped)(tsyringe_1.Lifecycle.ContainerScoped),
    __param(1, (0, tsyringe_1.inject)(Authentication_1.AuthenticationInjectionToken)),
    __param(2, (0, tsyringe_1.inject)(Config_1.ConfigInjectionToken)),
    __metadata("design:paramtypes", [ContractFactory_1.ContractFactory, Object, Object])
], StorageNodeRegistry);
exports.StorageNodeRegistry = StorageNodeRegistry;
//# sourceMappingURL=StorageNodeRegistry.js.map