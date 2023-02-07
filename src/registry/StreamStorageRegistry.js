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
exports.StreamStorageRegistry = void 0;
const StreamStorageRegistryV2Abi_json_1 = __importDefault(require("../ethereumArtifacts/StreamStorageRegistryV2Abi.json"));
const tsyringe_1 = require("tsyringe");
const Config_1 = require("../Config");
const Stream_1 = require("../Stream");
const Ethereum_1 = require("../Ethereum");
const protocol_1 = require("@streamr/protocol");
const StreamIDBuilder_1 = require("../StreamIDBuilder");
const contract_1 = require("../utils/contract");
const SynchronizedGraphQLClient_1 = require("../utils/SynchronizedGraphQLClient");
const events_1 = require("../events");
const Authentication_1 = require("../Authentication");
const ContractFactory_1 = require("../ContractFactory");
const utils_1 = require("@streamr/utils");
const LoggerFactory_1 = require("../utils/LoggerFactory");
const StreamFactory_1 = require("../StreamFactory");
const iterators_1 = require("../utils/iterators");
const lodash_1 = require("lodash");
/**
 * Stores storage node assignments (mapping of streamIds <-> storage nodes addresses)
 */
let StreamStorageRegistry = class StreamStorageRegistry {
    constructor(contractFactory, streamFactory, streamIdBuilder, graphQLClient, eventEmitter, authentication, loggerFactory, config) {
        this.contractFactory = contractFactory;
        this.streamFactory = streamFactory;
        this.streamIdBuilder = streamIdBuilder;
        this.graphQLClient = graphQLClient;
        this.authentication = authentication;
        this.config = config;
        this.logger = loggerFactory.createLogger(module);
        const chainProvider = (0, Ethereum_1.getStreamRegistryChainProvider)(config);
        this.streamStorageRegistryContractReadonly = this.contractFactory.createReadContract((0, utils_1.toEthereumAddress)(this.config.contracts.streamStorageRegistryChainAddress), StreamStorageRegistryV2Abi_json_1.default, chainProvider, 'streamStorageRegistry');
        this.initStreamAssignmentEventListener('addToStorageNode', 'Added', eventEmitter);
        this.initStreamAssignmentEventListener('removeFromStorageNode', 'Removed', eventEmitter);
    }
    initStreamAssignmentEventListener(clientEvent, contractEvent, eventEmitter) {
        (0, events_1.initEventGateway)(clientEvent, (emit) => {
            const listener = (streamId, nodeAddress, extra) => {
                emit({
                    streamId: (0, protocol_1.toStreamID)(streamId),
                    nodeAddress: (0, utils_1.toEthereumAddress)(nodeAddress),
                    blockNumber: extra.blockNumber
                });
            };
            this.streamStorageRegistryContractReadonly.on(contractEvent, listener);
            return listener;
        }, (listener) => {
            this.streamStorageRegistryContractReadonly.off(contractEvent, listener);
        }, eventEmitter);
    }
    async connectToContract() {
        if (!this.streamStorageRegistryContract) {
            const chainSigner = await this.authentication.getStreamRegistryChainSigner();
            this.streamStorageRegistryContract = this.contractFactory.createWriteContract((0, utils_1.toEthereumAddress)(this.config.contracts.streamStorageRegistryChainAddress), StreamStorageRegistryV2Abi_json_1.default, chainSigner, 'streamStorageRegistry');
        }
    }
    async addStreamToStorageNode(streamIdOrPath, nodeAddress) {
        const streamId = await this.streamIdBuilder.toStreamID(streamIdOrPath);
        this.logger.debug('adding stream %s to node %s', streamId, nodeAddress);
        await this.connectToContract();
        const ethersOverrides = (0, Ethereum_1.getStreamRegistryOverrides)(this.config);
        await (0, contract_1.waitForTx)(this.streamStorageRegistryContract.addStorageNode(streamId, nodeAddress, ethersOverrides));
    }
    async removeStreamFromStorageNode(streamIdOrPath, nodeAddress) {
        const streamId = await this.streamIdBuilder.toStreamID(streamIdOrPath);
        this.logger.debug('removing stream %s from node %s', streamId, nodeAddress);
        await this.connectToContract();
        const ethersOverrides = (0, Ethereum_1.getStreamRegistryOverrides)(this.config);
        await (0, contract_1.waitForTx)(this.streamStorageRegistryContract.removeStorageNode(streamId, nodeAddress, ethersOverrides));
    }
    async isStoredStream(streamIdOrPath, nodeAddress) {
        const streamId = await this.streamIdBuilder.toStreamID(streamIdOrPath);
        this.logger.debug('querying if stream %s is stored in storage node %s', streamId, nodeAddress);
        return this.streamStorageRegistryContractReadonly.isStorageNodeOf(streamId, nodeAddress);
    }
    async getStoredStreams(nodeAddress) {
        this.logger.debug('getting stored streams of node %s', nodeAddress);
        const blockNumbers = [];
        const res = await (0, iterators_1.collect)(this.graphQLClient.fetchPaginatedResults((lastId, pageSize) => {
            const query = `{
                    node (id: "${nodeAddress}") {
                        id
                        metadata
                        lastSeen
                        storedStreams (first: ${pageSize} orderBy: "id" where: { id_gt: "${lastId}"}) {
                            id,
                            metadata
                        }
                    }
                    _meta {
                        block {
                            number
                        }
                    }
                }`;
            return { query };
        }, (response) => {
            // eslint-disable-next-line no-underscore-dangle
            blockNumbers.push(response._meta.block.number);
            return (response.node !== null) ? response.node.storedStreams : [];
        }));
        const streams = res.map((stream) => {
            const props = Stream_1.Stream.parseMetadata(stream.metadata);
            return this.streamFactory.createStream((0, protocol_1.toStreamID)(stream.id), props); // toStreamID() not strictly necessary
        });
        return {
            streams,
            blockNumber: (0, lodash_1.min)(blockNumbers)
        };
    }
    async getStorageNodes(streamIdOrPath) {
        let queryResults;
        if (streamIdOrPath !== undefined) {
            const streamId = await this.streamIdBuilder.toStreamID(streamIdOrPath);
            this.logger.debug('getting storage nodes of stream %s', streamId);
            queryResults = await (0, iterators_1.collect)(this.graphQLClient.fetchPaginatedResults((lastId, pageSize) => {
                const query = `{
                        stream (id: "${streamId}") {
                            id
                            metadata
                            storageNodes (first: ${pageSize} orderBy: "id" where: { id_gt: "${lastId}"}) {
                                id
                                metadata
                                lastSeen
                            }
                        }
                    }`;
                return { query };
            }, (response) => {
                return (response.stream !== null) ? response.stream.storageNodes : [];
            }));
        }
        else {
            this.logger.debug('getting all storage nodes');
            queryResults = await (0, iterators_1.collect)(this.graphQLClient.fetchPaginatedResults((lastId, pageSize) => {
                const query = `{
                        nodes (first: ${pageSize} orderBy: "id" where: { id_gt: "${lastId}"}) {
                            id
                            metadata
                            lastSeen
                        }
                    }`;
                return { query };
            }));
        }
        return queryResults.map((node) => (0, utils_1.toEthereumAddress)(node.id));
    }
};
StreamStorageRegistry = __decorate([
    (0, tsyringe_1.scoped)(tsyringe_1.Lifecycle.ContainerScoped),
    __param(1, (0, tsyringe_1.inject)((0, tsyringe_1.delay)(() => StreamFactory_1.StreamFactory))),
    __param(2, (0, tsyringe_1.inject)(StreamIDBuilder_1.StreamIDBuilder)),
    __param(3, (0, tsyringe_1.inject)(SynchronizedGraphQLClient_1.SynchronizedGraphQLClient)),
    __param(4, (0, tsyringe_1.inject)(events_1.StreamrClientEventEmitter)),
    __param(5, (0, tsyringe_1.inject)(Authentication_1.AuthenticationInjectionToken)),
    __param(6, (0, tsyringe_1.inject)(LoggerFactory_1.LoggerFactory)),
    __param(7, (0, tsyringe_1.inject)(Config_1.ConfigInjectionToken)),
    __metadata("design:paramtypes", [ContractFactory_1.ContractFactory,
        StreamFactory_1.StreamFactory,
        StreamIDBuilder_1.StreamIDBuilder,
        SynchronizedGraphQLClient_1.SynchronizedGraphQLClient,
        events_1.StreamrClientEventEmitter, Object, LoggerFactory_1.LoggerFactory, Object])
], StreamStorageRegistry);
exports.StreamStorageRegistry = StreamStorageRegistry;
//# sourceMappingURL=StreamStorageRegistry.js.map