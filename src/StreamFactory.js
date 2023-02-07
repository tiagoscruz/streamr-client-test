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
exports.StreamFactory = void 0;
const tsyringe_1 = require("tsyringe");
const Config_1 = require("./Config");
const events_1 = require("./events");
const Publisher_1 = require("./publish/Publisher");
const StreamRegistry_1 = require("./registry/StreamRegistry");
const StreamRegistryCached_1 = require("./registry/StreamRegistryCached");
const StreamStorageRegistry_1 = require("./registry/StreamStorageRegistry");
const Stream_1 = require("./Stream");
const Resends_1 = require("./subscribe/Resends");
const Subscriber_1 = require("./subscribe/Subscriber");
const LoggerFactory_1 = require("./utils/LoggerFactory");
let StreamFactory = class StreamFactory {
    constructor(resends, publisher, subscriber, streamRegistryCached, streamRegistry, streamStorageRegistry, loggerFactory, eventEmitter, config) {
        this.resends = resends;
        this.publisher = publisher;
        this.subscriber = subscriber;
        this.streamRegistryCached = streamRegistryCached;
        this.streamRegistry = streamRegistry;
        this.streamStorageRegistry = streamStorageRegistry;
        this.loggerFactory = loggerFactory;
        this.eventEmitter = eventEmitter;
        this.config = config;
    }
    createStream(id, metadata) {
        return new Stream_1.Stream(id, metadata, this.resends, this.publisher, this.subscriber, this.streamRegistryCached, this.streamRegistry, this.streamStorageRegistry, this.loggerFactory, this.eventEmitter, this.config);
    }
};
StreamFactory = __decorate([
    (0, tsyringe_1.scoped)(tsyringe_1.Lifecycle.ContainerScoped),
    __param(1, (0, tsyringe_1.inject)((0, tsyringe_1.delay)(() => Publisher_1.Publisher))),
    __param(3, (0, tsyringe_1.inject)((0, tsyringe_1.delay)(() => StreamRegistryCached_1.StreamRegistryCached))),
    __param(4, (0, tsyringe_1.inject)((0, tsyringe_1.delay)(() => StreamRegistry_1.StreamRegistry))),
    __param(8, (0, tsyringe_1.inject)(Config_1.ConfigInjectionToken)),
    __metadata("design:paramtypes", [Resends_1.Resends,
        Publisher_1.Publisher,
        Subscriber_1.Subscriber,
        StreamRegistryCached_1.StreamRegistryCached,
        StreamRegistry_1.StreamRegistry,
        StreamStorageRegistry_1.StreamStorageRegistry,
        LoggerFactory_1.LoggerFactory,
        events_1.StreamrClientEventEmitter, Object])
], StreamFactory);
exports.StreamFactory = StreamFactory;
//# sourceMappingURL=StreamFactory.js.map