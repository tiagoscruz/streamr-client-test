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
var StreamRegistry_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StreamRegistry = void 0;
const StreamRegistryV4Abi_json_1 = __importDefault(require("../ethereumArtifacts/StreamRegistryV4Abi.json"));
const tsyringe_1 = require("tsyringe");
const Ethereum_1 = require("../Ethereum");
const promises_1 = require("../utils/promises");
const Config_1 = require("../Config");
const Stream_1 = require("../Stream");
const HttpUtil_1 = require("../HttpUtil");
const protocol_1 = require("@streamr/protocol");
const StreamIDBuilder_1 = require("../StreamIDBuilder");
const SynchronizedGraphQLClient_1 = require("../utils/SynchronizedGraphQLClient");
const searchStreams_1 = require("./searchStreams");
const GeneratorUtils_1 = require("../utils/GeneratorUtils");
const contract_1 = require("../utils/contract");
const permission_1 = require("../permission");
const StreamRegistryCached_1 = require("./StreamRegistryCached");
const Authentication_1 = require("../Authentication");
const ContractFactory_1 = require("../ContractFactory");
const utils_1 = require("@streamr/utils");
const LoggerFactory_1 = require("../utils/LoggerFactory");
const StreamFactory_1 = require("./../StreamFactory");
const iterators_1 = require("../utils/iterators");
const streamContractErrorProcessor = (err, streamId, registry) => {
    if (err.errors) {
        if (err.errors.some((e) => e.reason?.code === 'CALL_EXCEPTION')) {
            throw new HttpUtil_1.NotFoundError('Stream not found: id=' + streamId);
        }
        else {
            throw new Error(`Could not reach the ${registry} Smart Contract: ${err.errors[0]}`);
        }
    }
    else {
        throw new Error(err);
    }
};
let StreamRegistry = StreamRegistry_1 = class StreamRegistry {
    constructor(contractFactory, loggerFactory, streamIdBuilder, streamFactory, graphQLClient, streamRegistryCached, authentication, config) {
        this.contractFactory = contractFactory;
        this.streamIdBuilder = streamIdBuilder;
        this.streamFactory = streamFactory;
        this.graphQLClient = graphQLClient;
        this.streamRegistryCached = streamRegistryCached;
        this.authentication = authentication;
        this.config = config;
        this.logger = loggerFactory.createLogger(module);
        const chainProviders = (0, Ethereum_1.getAllStreamRegistryChainProviders)(config);
        this.streamRegistryContractsReadonly = chainProviders.map((provider) => {
            return this.contractFactory.createReadContract((0, utils_1.toEthereumAddress)(this.config.contracts.streamRegistryChainAddress), StreamRegistryV4Abi_json_1.default, provider, 'streamRegistry');
        });
    }
    parseStream(id, metadata) {
        const props = Stream_1.Stream.parseMetadata(metadata);
        return this.streamFactory.createStream(id, props);
    }
    async connectToContract() {
        if (!this.streamRegistryContract) {
            const chainSigner = await this.authentication.getStreamRegistryChainSigner();
            this.streamRegistryContract = this.contractFactory.createWriteContract((0, utils_1.toEthereumAddress)(this.config.contracts.streamRegistryChainAddress), StreamRegistryV4Abi_json_1.default, chainSigner, 'streamRegistry');
        }
    }
    async createStream(streamId, metadata) {
        const ethersOverrides = (0, Ethereum_1.getStreamRegistryOverrides)(this.config);
        const domainAndPath = protocol_1.StreamIDUtils.getDomainAndPath(streamId);
        if (domainAndPath === undefined) {
            throw new Error(`stream id "${streamId}" not valid`);
        }
        const [domain, path] = domainAndPath;
        await this.connectToContract();
        if ((0, utils_1.isENSName)(domain)) {
            /*
                The call to createStreamWithENS delegates the ENS ownership check, and therefore the
                call doesn't fail e.g. if the user doesn't own the ENS name. To see whether the stream
                creation succeeeds, we need to poll the chain for stream existence. If the polling timeouts, we don't
                know what the actual error was. (Most likely it has nothing to do with timeout
                -> we don't use the error from until(), but throw an explicit error instead.)
            */
            await (0, contract_1.waitForTx)(this.streamRegistryContract.createStreamWithENS(domain, path, JSON.stringify(metadata), ethersOverrides));
            try {
                await (0, promises_1.until)(async () => this.streamExistsOnChain(streamId), 
                // eslint-disable-next-line no-underscore-dangle
                this.config._timeouts.jsonRpc.timeout, 
                // eslint-disable-next-line no-underscore-dangle
                this.config._timeouts.jsonRpc.retryInterval);
            }
            catch (e) {
                throw new Error(`unable to create stream "${streamId}"`);
            }
        }
        else {
            await this.ensureStreamIdInNamespaceOfAuthenticatedUser(domain, streamId);
            await (0, contract_1.waitForTx)(this.streamRegistryContract.createStream(path, JSON.stringify(metadata), ethersOverrides));
        }
        return this.streamFactory.createStream(streamId, metadata);
    }
    async ensureStreamIdInNamespaceOfAuthenticatedUser(address, streamId) {
        const userAddress = await this.authentication.getAddress();
        if (address !== userAddress) {
            throw new Error(`stream id "${streamId}" not in namespace of authenticated user "${userAddress}"`);
        }
    }
    // TODO maybe we should require metadata to be StreamMetadata instead of Partial<StreamMetadata>
    // Most likely the contract doesn't make any merging (like we do in Stream#update)?
    async updateStream(streamId, metadata) {
        await this.connectToContract();
        const ethersOverrides = (0, Ethereum_1.getStreamRegistryOverrides)(this.config);
        await (0, contract_1.waitForTx)(this.streamRegistryContract.updateStreamMetadata(streamId, JSON.stringify(metadata), ethersOverrides));
        return this.streamFactory.createStream(streamId, metadata);
    }
    async deleteStream(streamIdOrPath) {
        const streamId = await this.streamIdBuilder.toStreamID(streamIdOrPath);
        await this.connectToContract();
        const ethersOverrides = (0, Ethereum_1.getStreamRegistryOverrides)(this.config);
        await (0, contract_1.waitForTx)(this.streamRegistryContract.deleteStream(streamId, ethersOverrides));
    }
    async streamExistsOnChain(streamIdOrPath) {
        const streamId = await this.streamIdBuilder.toStreamID(streamIdOrPath);
        this.logger.debug('checking if stream "%s" exists on chain', streamId);
        return Promise.any([
            ...this.streamRegistryContractsReadonly.map((contract) => {
                return contract.exists(streamId);
            })
        ]);
    }
    async getStream(streamIdOrPath) {
        const streamId = await this.streamIdBuilder.toStreamID(streamIdOrPath);
        let metadata;
        try {
            metadata = await this.queryAllReadonlyContracts((contract) => {
                return contract.getStreamMetadata(streamId);
            });
        }
        catch (err) {
            return streamContractErrorProcessor(err, streamId, 'StreamRegistry');
        }
        return this.parseStream(streamId, metadata);
    }
    searchStreams(term, permissionFilter) {
        return (0, searchStreams_1.searchStreams)(term, permissionFilter, this.graphQLClient, (id, metadata) => this.parseStream(id, metadata), this.logger);
    }
    getStreamPublishers(streamIdOrPath) {
        return this.getStreamPublishersOrSubscribersList(streamIdOrPath, 'publishExpiration');
    }
    getStreamSubscribers(streamIdOrPath) {
        return this.getStreamPublishersOrSubscribersList(streamIdOrPath, 'subscribeExpiration');
    }
    async *getStreamPublishersOrSubscribersList(streamIdOrPath, fieldName) {
        const streamId = await this.streamIdBuilder.toStreamID(streamIdOrPath);
        const backendResults = this.graphQLClient.fetchPaginatedResults((lastId, pageSize) => StreamRegistry_1.buildStreamPublishersOrSubscribersQuery(streamId, fieldName, lastId, pageSize));
        /*
         * There can be orphaned permission entities if a stream is deleted (currently
         * we don't remove the assigned permissions, see ETH-222)
         * TODO remove the filtering when ETH-222 has been implemented, and remove also
         * stream result field in buildStreamPublishersOrSubscribersQuery as it is
         * no longer needed
         */
        const validItems = (0, GeneratorUtils_1.filter)(backendResults, (p) => p.stream !== null);
        yield* (0, GeneratorUtils_1.map)(validItems, (item) => item.userAddress);
    }
    static buildStreamPublishersOrSubscribersQuery(streamId, fieldName, lastId, pageSize) {
        const query = `
        {
            permissions (
                first: ${pageSize}
                orderBy: "id"
                where: {
                    id_gt: "${lastId}"
                    stream: "${streamId}"
                    ${fieldName}_gt: "${Math.round(Date.now() / 1000)}"
                }
            ) {
                id
                userAddress
                stream {
                    id
                }
            }
        }`;
        return { query };
    }
    // --------------------------------------------------------------------------------------------
    // Permissions
    // --------------------------------------------------------------------------------------------
    /* eslint-disable no-else-return */
    async hasPermission(query) {
        const streamId = await this.streamIdBuilder.toStreamID(query.streamId);
        return this.queryAllReadonlyContracts((contract) => {
            const permissionType = (0, permission_1.streamPermissionToSolidityType)(query.permission);
            if ((0, permission_1.isPublicPermissionQuery)(query)) {
                return contract.hasPublicPermission(streamId, permissionType);
            }
            else if (query.allowPublic) {
                return contract.hasPermission(streamId, (0, utils_1.toEthereumAddress)(query.user), permissionType);
            }
            else {
                return contract.hasDirectPermission(streamId, (0, utils_1.toEthereumAddress)(query.user), permissionType);
            }
        });
    }
    async getPermissions(streamIdOrPath) {
        const streamId = await this.streamIdBuilder.toStreamID(streamIdOrPath);
        const queryResults = await (0, iterators_1.collect)(this.graphQLClient.fetchPaginatedResults((lastId, pageSize) => {
            const query = `{
                    stream (id: "${streamId}") {
                        id
                        metadata
                        permissions(first: ${pageSize} orderBy: "id" where: { id_gt: "${lastId}"}) {
                            id
                            userAddress
                            canEdit
                            canDelete
                            publishExpiration
                            subscribeExpiration
                            canGrant
                        }
                    }
                }`;
            return { query };
        }, (response) => {
            if (response.stream !== null) {
                return response.stream.permissions;
            }
            else {
                throw new HttpUtil_1.NotFoundError('stream not found: id: ' + streamId);
            }
        }));
        const assignments = [];
        queryResults.forEach((permissionResult) => {
            const permissions = (0, permission_1.convertChainPermissionsToStreamPermissions)(permissionResult);
            /*
            * There can be query results, which don't contain any permissions. That happens if a
            * user revokes all permissions from a stream. Currently we don't remove these empty assignments
            * from The Graph index. TODO remove the "permission.length > 0" if/when we implement the
            * empty assignments cleanup in The Graph.
            */
            if (permissions.length > 0) {
                if (permissionResult.userAddress === permission_1.PUBLIC_PERMISSION_ADDRESS) {
                    assignments.push({
                        public: true,
                        permissions
                    });
                }
                else {
                    assignments.push({
                        user: permissionResult.userAddress,
                        permissions
                    });
                }
            }
        });
        return assignments;
    }
    async grantPermissions(streamIdOrPath, ...assignments) {
        return this.updatePermissions(streamIdOrPath, (streamId, user, solidityType) => {
            return (user === undefined)
                ? this.streamRegistryContract.grantPublicPermission(streamId, solidityType, (0, Ethereum_1.getStreamRegistryOverrides)(this.config))
                : this.streamRegistryContract.grantPermission(streamId, user, solidityType, (0, Ethereum_1.getStreamRegistryOverrides)(this.config));
        }, ...assignments);
    }
    async revokePermissions(streamIdOrPath, ...assignments) {
        return this.updatePermissions(streamIdOrPath, (streamId, user, solidityType) => {
            return (user === undefined)
                ? this.streamRegistryContract.revokePublicPermission(streamId, solidityType, (0, Ethereum_1.getStreamRegistryOverrides)(this.config))
                : this.streamRegistryContract.revokePermission(streamId, user, solidityType, (0, Ethereum_1.getStreamRegistryOverrides)(this.config));
        }, ...assignments);
    }
    async updatePermissions(streamIdOrPath, createTransaction, ...assignments) {
        const streamId = await this.streamIdBuilder.toStreamID(streamIdOrPath);
        this.streamRegistryCached.clearStream(streamId);
        await this.connectToContract();
        for (const assignment of assignments) {
            for (const permission of assignment.permissions) {
                const solidityType = (0, permission_1.streamPermissionToSolidityType)(permission);
                const user = (0, permission_1.isPublicPermissionAssignment)(assignment) ? undefined : (0, utils_1.toEthereumAddress)(assignment.user);
                const txToSubmit = createTransaction(streamId, user, solidityType);
                // eslint-disable-next-line no-await-in-loop
                await (0, contract_1.waitForTx)(txToSubmit);
            }
        }
    }
    async setPermissions(...items) {
        const streamIds = [];
        const targets = [];
        const chainPermissions = [];
        for (const item of items) {
            // eslint-disable-next-line no-await-in-loop
            const streamId = await this.streamIdBuilder.toStreamID(item.streamId);
            this.streamRegistryCached.clearStream(streamId);
            streamIds.push(streamId);
            targets.push(item.assignments.map((assignment) => {
                return (0, permission_1.isPublicPermissionAssignment)(assignment) ? permission_1.PUBLIC_PERMISSION_ADDRESS : assignment.user;
            }));
            chainPermissions.push(item.assignments.map((assignment) => {
                return (0, permission_1.convertStreamPermissionsToChainPermission)(assignment.permissions);
            }));
        }
        await this.connectToContract();
        const ethersOverrides = (0, Ethereum_1.getStreamRegistryOverrides)(this.config);
        const txToSubmit = this.streamRegistryContract.setPermissionsMultipleStreams(streamIds, targets, chainPermissions, ethersOverrides);
        await (0, contract_1.waitForTx)(txToSubmit);
    }
    async isStreamPublisher(streamIdOrPath, userAddress) {
        const streamId = await this.streamIdBuilder.toStreamID(streamIdOrPath);
        try {
            return await this.queryAllReadonlyContracts((contract) => {
                return contract.hasPermission(streamId, userAddress, (0, permission_1.streamPermissionToSolidityType)(permission_1.StreamPermission.PUBLISH));
            });
        }
        catch (err) {
            return streamContractErrorProcessor(err, streamId, 'StreamPermission');
        }
    }
    async isStreamSubscriber(streamIdOrPath, userAddress) {
        const streamId = await this.streamIdBuilder.toStreamID(streamIdOrPath);
        try {
            return await this.queryAllReadonlyContracts((contract) => {
                return contract.hasPermission(streamId, userAddress, (0, permission_1.streamPermissionToSolidityType)(permission_1.StreamPermission.SUBSCRIBE));
            });
        }
        catch (err) {
            return streamContractErrorProcessor(err, streamId, 'StreamPermission');
        }
    }
    // --------------------------------------------------------------------------------------------
    // Helpers
    // --------------------------------------------------------------------------------------------
    queryAllReadonlyContracts(call) {
        return Promise.any([
            ...this.streamRegistryContractsReadonly.map((contract) => {
                return call(contract);
            })
        ]);
    }
};
StreamRegistry = StreamRegistry_1 = __decorate([
    (0, tsyringe_1.scoped)(tsyringe_1.Lifecycle.ContainerScoped),
    __param(1, (0, tsyringe_1.inject)(LoggerFactory_1.LoggerFactory)),
    __param(2, (0, tsyringe_1.inject)(StreamIDBuilder_1.StreamIDBuilder)),
    __param(4, (0, tsyringe_1.inject)(SynchronizedGraphQLClient_1.SynchronizedGraphQLClient)),
    __param(5, (0, tsyringe_1.inject)((0, tsyringe_1.delay)(() => StreamRegistryCached_1.StreamRegistryCached))),
    __param(6, (0, tsyringe_1.inject)(Authentication_1.AuthenticationInjectionToken)),
    __param(7, (0, tsyringe_1.inject)(Config_1.ConfigInjectionToken)),
    __metadata("design:paramtypes", [ContractFactory_1.ContractFactory,
        LoggerFactory_1.LoggerFactory,
        StreamIDBuilder_1.StreamIDBuilder,
        StreamFactory_1.StreamFactory,
        SynchronizedGraphQLClient_1.SynchronizedGraphQLClient,
        StreamRegistryCached_1.StreamRegistryCached, Object, Object])
], StreamRegistry);
exports.StreamRegistry = StreamRegistry;
//# sourceMappingURL=StreamRegistry.js.map