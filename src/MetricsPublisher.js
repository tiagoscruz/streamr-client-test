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
exports.MetricsPublisher = exports.DEFAULTS = void 0;
const tsyringe_1 = require("tsyringe");
const events_1 = require("./events");
const DestroySignal_1 = require("./DestroySignal");
const NetworkNodeFacade_1 = require("./NetworkNodeFacade");
const Publisher_1 = require("./publish/Publisher");
const Config_1 = require("./Config");
const promises_1 = require("./utils/promises");
const utils_1 = require("@streamr/utils");
exports.DEFAULTS = {
    periods: [
        {
            duration: 60000,
            streamId: 'streamr.eth/metrics/nodes/firehose/min'
        },
        {
            duration: 3600000,
            streamId: 'streamr.eth/metrics/nodes/firehose/hour'
        },
        {
            duration: 86400000,
            streamId: 'streamr.eth/metrics/nodes/firehose/day'
        }
    ],
    maxPublishDelay: 30000
};
const getNormalizedConfig = (config) => {
    if (config.metrics === true) {
        return exports.DEFAULTS;
    }
    else if (config.metrics === false) {
        return {
            ...exports.DEFAULTS,
            periods: []
        };
    }
    else if (config.metrics !== undefined) {
        return {
            ...exports.DEFAULTS,
            ...config.metrics
        };
    }
    else {
        const isEthereumAuth = (config.auth?.ethereum !== undefined);
        return {
            ...exports.DEFAULTS,
            periods: isEthereumAuth ? [] : exports.DEFAULTS.periods
        };
    }
};
let MetricsPublisher = class MetricsPublisher {
    constructor(publisher, node, eventEmitter, destroySignal, config) {
        this.publisher = publisher;
        this.node = node;
        this.eventEmitter = eventEmitter;
        this.destroySignal = destroySignal;
        this.config = getNormalizedConfig(config);
        const ensureStarted = (0, promises_1.pOnce)(async () => {
            const node = await this.node.getNode();
            const metricsContext = node.getMetricsContext();
            const partitionKey = (0, NetworkNodeFacade_1.getEthereumAddressFromNodeId)(node.getNodeId()).toLowerCase();
            this.config.periods.map((config) => {
                return metricsContext.createReportProducer(async (report) => {
                    await this.publish(report, config.streamId, partitionKey);
                }, config.duration, this.destroySignal.abortSignal);
            });
        });
        if (this.config.periods.length > 0) {
            this.eventEmitter.on('publish', () => ensureStarted());
            this.eventEmitter.on('subscribe', () => ensureStarted());
        }
    }
    async publish(report, streamId, partitionKey) {
        await (0, utils_1.wait)(Math.random() * this.config.maxPublishDelay);
        try {
            await this.publisher.publish(streamId, report, {
                timestamp: report.period.end,
                partitionKey
            });
        }
        catch (e) {
            console.warn(`Unable to publish metrics: ${e.message}`);
        }
    }
};
MetricsPublisher = __decorate([
    (0, tsyringe_1.scoped)(tsyringe_1.Lifecycle.ContainerScoped),
    __param(0, (0, tsyringe_1.inject)(Publisher_1.Publisher)),
    __param(1, (0, tsyringe_1.inject)(NetworkNodeFacade_1.NetworkNodeFacade)),
    __param(2, (0, tsyringe_1.inject)(events_1.StreamrClientEventEmitter)),
    __param(3, (0, tsyringe_1.inject)(DestroySignal_1.DestroySignal)),
    __param(4, (0, tsyringe_1.inject)(Config_1.ConfigInjectionToken)),
    __metadata("design:paramtypes", [Publisher_1.Publisher,
        NetworkNodeFacade_1.NetworkNodeFacade,
        events_1.StreamrClientEventEmitter,
        DestroySignal_1.DestroySignal, Object])
], MetricsPublisher);
exports.MetricsPublisher = MetricsPublisher;
//# sourceMappingURL=MetricsPublisher.js.map