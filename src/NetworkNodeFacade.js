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
exports.NetworkNodeFacade = exports.NetworkNodeFactory = exports.getEthereumAddressFromNodeId = void 0;
/**
 * Wrap a network node.
 */
const tsyringe_1 = require("tsyringe");
const eventemitter3_1 = __importDefault(require("eventemitter3"));
const network_node_1 = require("@streamr/network-node");
const utils_1 = require("@streamr/utils");
const uuid_1 = require("./utils/uuid");
const promises_1 = require("./utils/promises");
const Config_1 = require("./Config");
const DestroySignal_1 = require("./DestroySignal");
const Ethereum_1 = require("./Ethereum");
const getTrackerRegistryFromContract_1 = require("./registry/getTrackerRegistryFromContract");
const Authentication_1 = require("./Authentication");
const utils_2 = require("@streamr/utils");
const getEthereumAddressFromNodeId = (nodeId) => {
    const ETHERUM_ADDRESS_LENGTH = 42;
    return nodeId.substring(0, ETHERUM_ADDRESS_LENGTH);
};
exports.getEthereumAddressFromNodeId = getEthereumAddressFromNodeId;
/**
 * The factory is used so that integration tests can replace the real network node with a fake instance
 */
/* eslint-disable class-methods-use-this */
let NetworkNodeFactory = class NetworkNodeFactory {
    createNetworkNode(opts) {
        return (0, network_node_1.createNetworkNode)(opts);
    }
};
NetworkNodeFactory = __decorate([
    (0, tsyringe_1.scoped)(tsyringe_1.Lifecycle.ContainerScoped)
], NetworkNodeFactory);
exports.NetworkNodeFactory = NetworkNodeFactory;
/**
 * Wrap a network node.
 * Lazily creates & starts node on first call to getNode().
 */
let NetworkNodeFacade = class NetworkNodeFacade {
    constructor(destroySignal, networkNodeFactory, authentication, config) {
        this.startNodeCalled = false;
        this.startNodeComplete = false;
        /**
         * Stop network node, or wait for it to stop if already stopping.
         * Subsequent calls to getNode/start will fail.
         */
        this.destroy = (0, promises_1.pOnce)(async () => {
            const node = this.cachedNode;
            this.cachedNode = undefined;
            // stop node only if started or in progress
            if (node && this.startNodeCalled) {
                if (!this.startNodeComplete) {
                    // wait for start to finish before stopping node
                    const startNodeTask = this.startNodeTask();
                    this.startNodeTask.reset(); // allow subsequent calls to fail
                    await startNodeTask;
                }
                await node.stop();
            }
            this.startNodeTask.reset(); // allow subsequent calls to fail
        });
        /**
         * Start network node, or wait for it to start if already started.
         */
        this.startNodeTask = (0, promises_1.pOnce)(async () => {
            this.startNodeCalled = true;
            try {
                const node = await this.initNode();
                if (!this.destroySignal.isDestroyed()) {
                    node.start();
                }
                if (this.destroySignal.isDestroyed()) {
                    await node.stop();
                }
                else {
                    this.eventEmitter.emit('start');
                }
                this.assertNotDestroyed();
                return node;
            }
            finally {
                this.startNodeComplete = true;
            }
        });
        this.startNode = this.startNodeTask;
        this.getNode = this.startNodeTask;
        this.destroySignal = destroySignal;
        this.networkNodeFactory = networkNodeFactory;
        this.authentication = authentication;
        this.config = config;
        this.eventEmitter = new eventemitter3_1.default();
        destroySignal.onDestroy.listen(this.destroy);
    }
    assertNotDestroyed() {
        this.destroySignal.assertNotDestroyed();
    }
    async getNetworkOptions() {
        let id = this.config.network.id;
        if (id == null || id === '') {
            id = await this.generateId();
        }
        else {
            const ethereumAddress = await this.authentication.getAddress();
            if (!id.toLowerCase().startsWith(ethereumAddress)) {
                throw new Error(`given node id ${id} not compatible with authenticated wallet ${ethereumAddress}`);
            }
        }
        const trackers = ('contractAddress' in this.config.network.trackers)
            ? (await (0, getTrackerRegistryFromContract_1.getTrackerRegistryFromContract)({
                contractAddress: (0, utils_2.toEthereumAddress)(this.config.network.trackers.contractAddress),
                jsonRpcProvider: (0, Ethereum_1.getMainnetProvider)(this.config)
            })).getAllTrackers()
            : this.config.network.trackers;
        return {
            ...this.config.network,
            id,
            trackers,
            metricsContext: new utils_1.MetricsContext()
        };
    }
    async initNode() {
        this.assertNotDestroyed();
        if (this.cachedNode) {
            return this.cachedNode;
        }
        const node = this.networkNodeFactory.createNetworkNode(await this.getNetworkOptions());
        if (!this.destroySignal.isDestroyed()) {
            this.cachedNode = node;
        }
        return node;
    }
    async generateId() {
        const address = await this.authentication.getAddress();
        return `${address}#${(0, uuid_1.uuid)()}`;
    }
    async getNodeId() {
        const node = await this.getNode();
        return node.getNodeId();
    }
    /**
     * Calls publish on node after starting it.
     * Basically a wrapper around: (await getNode()).publish(…)
     * but will be sync in case that node is already started.
     * Zalgo intentional. See below.
     */
    publishToNode(streamMessage) {
        // NOTE: function is intentionally not async for performance reasons.
        // Will call cachedNode.publish immediately if cachedNode is set.
        // Otherwise will wait for node to start.
        this.destroySignal.assertNotDestroyed();
        if (this.isStarting()) {
            // use .then instead of async/await so
            // this.cachedNode.publish call can be sync
            return this.startNodeTask().then((node) => {
                return node.publish(streamMessage);
            });
        }
        return this.cachedNode.publish(streamMessage);
    }
    async openProxyConnection(streamPartId, nodeId, direction) {
        if (this.isStarting()) {
            await this.startNodeTask();
        }
        await this.cachedNode.openProxyConnection(streamPartId, nodeId, direction, (await this.authentication.getAddress()));
    }
    async closeProxyConnection(streamPartId, nodeId, direction) {
        if (this.isStarting()) {
            return;
        }
        await this.cachedNode.closeProxyConnection(streamPartId, nodeId, direction);
    }
    isStarting() {
        return !this.cachedNode || !this.startNodeComplete;
    }
    once(eventName, listener) {
        this.eventEmitter.once(eventName, listener);
    }
};
NetworkNodeFacade = __decorate([
    (0, tsyringe_1.scoped)(tsyringe_1.Lifecycle.ContainerScoped),
    __param(2, (0, tsyringe_1.inject)(Authentication_1.AuthenticationInjectionToken)),
    __param(3, (0, tsyringe_1.inject)(Config_1.ConfigInjectionToken)),
    __metadata("design:paramtypes", [DestroySignal_1.DestroySignal,
        NetworkNodeFactory, Object, Object])
], NetworkNodeFacade);
exports.NetworkNodeFacade = NetworkNodeFacade;
//# sourceMappingURL=NetworkNodeFacade.js.map