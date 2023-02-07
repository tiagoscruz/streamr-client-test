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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionSession = void 0;
const tsyringe_1 = require("tsyringe");
const protocol_1 = require("@streamr/protocol");
const Scaffold_1 = require("../utils/Scaffold");
const Signal_1 = require("../utils/Signal");
const subscribePipeline_1 = require("./subscribePipeline");
const NetworkNodeFacade_1 = require("../NetworkNodeFacade");
const Resends_1 = require("./Resends");
const GroupKeyStore_1 = require("../encryption/GroupKeyStore");
const SubscriberKeyExchange_1 = require("../encryption/SubscriberKeyExchange");
const StreamRegistryCached_1 = require("../registry/StreamRegistryCached");
const events_1 = require("../events");
const DestroySignal_1 = require("../DestroySignal");
const Config_1 = require("../Config");
const LoggerFactory_1 = require("../utils/LoggerFactory");
/**
 * Manages adding & removing subscriptions to node as needed.
 * A session contains one or more subscriptions to a single streamId + streamPartition pair.
 */
let SubscriptionSession = class SubscriptionSession {
    constructor(streamPartId, resends, groupKeyStore, subscriberKeyExchange, streamRegistryCached, node, streamrClientEventEmitter, destroySignal, loggerFactory, config) {
        this.onRetired = Signal_1.Signal.once();
        this.isRetired = false;
        this.isStopped = false;
        this.subscriptions = new Set();
        this.pendingRemoval = new WeakSet();
        this.onMessageInput = async (msg) => {
            if (!msg || this.isStopped || this.isRetired) {
                return;
            }
            if (msg.getStreamPartID() !== this.streamPartId) {
                return;
            }
            if (msg.messageType !== protocol_1.StreamMessageType.MESSAGE) {
                return;
            }
            await this.pipeline.push(msg);
        };
        this.updateNodeSubscriptions = (() => {
            let node;
            return (0, Scaffold_1.Scaffold)([
                async () => {
                    node = await this.subscribe();
                    return async () => {
                        const prevNode = node;
                        node = undefined;
                        await this.unsubscribe(prevNode);
                        await this.stop();
                    };
                },
            ], () => this.shouldBeSubscribed());
        })();
        this.streamPartId = streamPartId;
        this.distributeMessage = this.distributeMessage.bind(this);
        this.node = node;
        this.onError = this.onError.bind(this);
        this.pipeline = (0, subscribePipeline_1.createSubscribePipeline)({
            streamPartId,
            resends,
            groupKeyStore,
            subscriberKeyExchange,
            streamRegistryCached,
            streamrClientEventEmitter,
            loggerFactory,
            destroySignal,
            config: config
        });
        this.pipeline.onError.listen(this.onError);
        this.pipeline
            .pipe(this.distributeMessage)
            .onBeforeFinally.listen(async () => {
            if (!this.isStopped) {
                await this.stop();
            }
        });
        this.pipeline.flow();
    }
    async retire() {
        if (this.isRetired) {
            return;
        }
        this.isRetired = true;
        await this.onRetired.trigger();
    }
    async onError(error) {
        // eslint-disable-next-line promise/no-promise-in-callback
        await Promise.allSettled([...this.subscriptions].map(async (sub) => {
            await sub.handleError(error);
        }));
    }
    async *distributeMessage(src) {
        for await (const msg of src) {
            await Promise.all([...this.subscriptions].map(async (sub) => {
                await sub.push(msg);
            }));
            yield msg;
        }
    }
    async subscribe() {
        const node = await this.node.getNode();
        node.addMessageListener(this.onMessageInput);
        node.subscribe(this.streamPartId);
        return node;
    }
    async unsubscribe(node) {
        this.pipeline.end();
        this.pipeline.return();
        this.pipeline.onError.end(new Error('done'));
        node.removeMessageListener(this.onMessageInput);
        node.unsubscribe(this.streamPartId);
    }
    async updateSubscriptions() {
        await this.updateNodeSubscriptions();
        if (!this.shouldBeSubscribed() && !this.isStopped) {
            await this.stop();
        }
    }
    shouldBeSubscribed() {
        return !this.isRetired && !this.isStopped && !!this.count();
    }
    async stop() {
        this.isStopped = true;
        this.pipeline.end();
        await this.retire();
        await this.pipeline.return();
    }
    has(sub) {
        return this.subscriptions.has(sub);
    }
    /**
     * Add subscription & appropriate connection handle.
     */
    async add(sub) {
        if (!sub || this.subscriptions.has(sub) || this.pendingRemoval.has(sub)) {
            return;
        } // already has
        this.subscriptions.add(sub);
        sub.onBeforeFinally.listen(() => {
            return this.remove(sub);
        });
        await this.updateSubscriptions();
    }
    /**
     * Remove subscription & appropriate connection handle.
     */
    async remove(sub) {
        if (!sub || this.pendingRemoval.has(sub) || !this.subscriptions.has(sub)) {
            return;
        }
        this.pendingRemoval.add(sub);
        this.subscriptions.delete(sub);
        try {
            if (!sub.isDone()) {
                await sub.unsubscribe();
            }
        }
        finally {
            await this.updateSubscriptions();
        }
    }
    /**
     * How many subscriptions
     */
    count() {
        return this.subscriptions.size;
    }
};
SubscriptionSession = __decorate([
    __param(9, (0, tsyringe_1.inject)(Config_1.ConfigInjectionToken)),
    __metadata("design:paramtypes", [String, Resends_1.Resends,
        GroupKeyStore_1.GroupKeyStore,
        SubscriberKeyExchange_1.SubscriberKeyExchange,
        StreamRegistryCached_1.StreamRegistryCached,
        NetworkNodeFacade_1.NetworkNodeFacade,
        events_1.StreamrClientEventEmitter,
        DestroySignal_1.DestroySignal,
        LoggerFactory_1.LoggerFactory, Object])
], SubscriptionSession);
exports.SubscriptionSession = SubscriptionSession;
//# sourceMappingURL=SubscriptionSession.js.map