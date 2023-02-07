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
exports.Subscriber = void 0;
const tsyringe_1 = require("tsyringe");
const promises_1 = require("../utils/promises");
const SubscriptionSession_1 = require("./SubscriptionSession");
const Subscription_1 = require("./Subscription");
const StreamIDBuilder_1 = require("../StreamIDBuilder");
const Resends_1 = require("./Resends");
const GroupKeyStore_1 = require("../encryption/GroupKeyStore");
const SubscriberKeyExchange_1 = require("../encryption/SubscriberKeyExchange");
const NetworkNodeFacade_1 = require("../NetworkNodeFacade");
const events_1 = require("../events");
const DestroySignal_1 = require("../DestroySignal");
const Config_1 = require("../Config");
const StreamRegistryCached_1 = require("../registry/StreamRegistryCached");
const LoggerFactory_1 = require("../utils/LoggerFactory");
let Subscriber = class Subscriber {
    constructor(streamIdBuilder, resends, groupKeyStore, subscriberKeyExchange, streamRegistryCached, node, streamrClientEventEmitter, destroySignal, config, loggerFactory) {
        this.subSessions = new Map();
        this.streamIdBuilder = streamIdBuilder;
        this.resends = resends;
        this.groupKeyStore = groupKeyStore;
        this.subscriberKeyExchange = subscriberKeyExchange;
        this.streamRegistryCached = streamRegistryCached;
        this.node = node;
        this.streamrClientEventEmitter = streamrClientEventEmitter;
        this.destroySignal = destroySignal;
        this.config = config;
        this.loggerFactory = loggerFactory;
        this.logger = loggerFactory.createLogger(module);
    }
    getOrCreateSubscriptionSession(streamPartId) {
        if (this.subSessions.has(streamPartId)) {
            return this.getSubscriptionSession(streamPartId);
        }
        const subSession = new SubscriptionSession_1.SubscriptionSession(streamPartId, this.resends, this.groupKeyStore, this.subscriberKeyExchange, this.streamRegistryCached, this.node, this.streamrClientEventEmitter, this.destroySignal, this.loggerFactory, this.config);
        this.subSessions.set(streamPartId, subSession);
        subSession.onRetired.listen(() => {
            this.subSessions.delete(streamPartId);
        });
        this.logger.debug('created new SubscriptionSession for stream part %s', streamPartId);
        return subSession;
    }
    async add(sub) {
        const subSession = this.getOrCreateSubscriptionSession(sub.streamPartId);
        // add subscription to subSession
        try {
            await subSession.add(sub);
        }
        catch (err) {
            this.logger.debug('failed to add Subscription to SubscriptionSession, reason: %s', err);
            // clean up if fail
            await this.remove(sub);
            throw err;
        }
    }
    async remove(sub) {
        if (!sub) {
            return;
        }
        const subSession = this.subSessions.get(sub.streamPartId);
        if (!subSession) {
            return;
        }
        await subSession.remove(sub);
    }
    async unsubscribe(streamDefinitionOrSubscription) {
        if (streamDefinitionOrSubscription instanceof Subscription_1.Subscription) {
            return this.remove(streamDefinitionOrSubscription);
        }
        return this.removeAll(streamDefinitionOrSubscription);
    }
    /**
     * Remove all subscriptions, optionally only those matching options.
     */
    async removeAll(streamDefinition) {
        const subs = !streamDefinition
            ? this.getAllSubscriptions()
            : await this.getSubscriptions(streamDefinition);
        return (0, promises_1.allSettledValues)(subs.map((sub) => (this.remove(sub))));
    }
    /**
     * Count all subscriptions.
     */
    countAll() {
        let count = 0;
        this.subSessions.forEach((s) => {
            count += s.count();
        });
        return count;
    }
    /**
     * Count all matching subscriptions.
     */
    // TODO rename this to something more specific?
    async count(streamDefinition) {
        if (streamDefinition === undefined) {
            return this.countAll();
        }
        return (await this.getSubscriptions(streamDefinition)).length;
    }
    /**
     * Get all subscriptions.
     */
    getAllSubscriptions() {
        return [...this.subSessions.values()].reduce((o, s) => {
            // @ts-expect-error private
            o.push(...s.subscriptions);
            return o;
        }, []);
    }
    /**
     * Get subscription session for matching sub options.
     */
    getSubscriptionSession(streamPartId) {
        return this.subSessions.get(streamPartId);
    }
    countSubscriptionSessions() {
        return this.subSessions.size;
    }
    async getSubscriptions(streamDefinition) {
        if (!streamDefinition) {
            return this.getAllSubscriptions();
        }
        const results = [];
        await Promise.all([...this.subSessions.values()].map(async (subSession) => {
            const isMatch = await this.streamIdBuilder.match(streamDefinition, subSession.streamPartId);
            if (isMatch) {
                results.push(subSession);
            }
        }));
        return results.flatMap((subSession) => ([
            // @ts-expect-error private
            ...subSession.subscriptions
        ]));
    }
};
Subscriber = __decorate([
    (0, tsyringe_1.scoped)(tsyringe_1.Lifecycle.ContainerScoped),
    __param(4, (0, tsyringe_1.inject)((0, tsyringe_1.delay)(() => StreamRegistryCached_1.StreamRegistryCached))),
    __param(8, (0, tsyringe_1.inject)(Config_1.ConfigInjectionToken)),
    __param(9, (0, tsyringe_1.inject)(LoggerFactory_1.LoggerFactory)),
    __metadata("design:paramtypes", [StreamIDBuilder_1.StreamIDBuilder,
        Resends_1.Resends,
        GroupKeyStore_1.GroupKeyStore,
        SubscriberKeyExchange_1.SubscriberKeyExchange,
        StreamRegistryCached_1.StreamRegistryCached,
        NetworkNodeFacade_1.NetworkNodeFacade,
        events_1.StreamrClientEventEmitter,
        DestroySignal_1.DestroySignal, Object, LoggerFactory_1.LoggerFactory])
], Subscriber);
exports.Subscriber = Subscriber;
//# sourceMappingURL=Subscriber.js.map