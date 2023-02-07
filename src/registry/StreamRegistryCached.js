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
exports.StreamRegistryCached = void 0;
const tsyringe_1 = require("tsyringe");
const caches_1 = require("../utils/caches");
const Config_1 = require("../Config");
const StreamRegistry_1 = require("./StreamRegistry");
const permission_1 = require("../permission");
const LoggerFactory_1 = require("../utils/LoggerFactory");
const SEPARATOR = '|'; // always use SEPARATOR for cache key
/* eslint-disable no-underscore-dangle */
let StreamRegistryCached = class StreamRegistryCached {
    constructor(loggerFactory, streamRegistry, config) {
        this.streamRegistry = streamRegistry;
        this.logger = loggerFactory.createLogger(module);
        this._getStream = (0, caches_1.CacheAsyncFn)((streamId) => {
            return this.streamRegistry.getStream(streamId);
        }, {
            ...config.cache,
            cacheKey: ([streamId]) => {
                // see clearStream
                return `${streamId}${SEPARATOR}`;
            }
        });
        this._isStreamPublisher = (0, caches_1.CacheAsyncFn)((streamId, ethAddress) => {
            return this.streamRegistry.isStreamPublisher(streamId, ethAddress);
        }, {
            ...config.cache,
            cacheKey([streamId, ethAddress]) {
                return [streamId, ethAddress].join(SEPARATOR);
            }
        });
        this._isStreamSubscriber = (0, caches_1.CacheAsyncFn)((streamId, ethAddress) => {
            return this.streamRegistry.isStreamSubscriber(streamId, ethAddress);
        }, {
            ...config.cache,
            cacheKey([streamId, ethAddress]) {
                return [streamId, ethAddress].join(SEPARATOR);
            }
        });
        this._isPublic = (0, caches_1.CacheAsyncFn)((streamId) => {
            return this.streamRegistry.hasPermission({
                streamId,
                public: true,
                permission: permission_1.StreamPermission.SUBSCRIBE
            });
        }, {
            ...config.cache,
            cacheKey([streamId]) {
                return ['PublicSubscribe', streamId].join(SEPARATOR);
            }
        });
    }
    getStream(streamId) {
        return this._getStream(streamId);
    }
    isStreamPublisher(streamId, ethAddress) {
        return this._isStreamPublisher(streamId, ethAddress);
    }
    isStreamSubscriber(streamId, ethAddress) {
        return this._isStreamSubscriber(streamId, ethAddress);
    }
    isPublic(streamId) {
        return this._isPublic(streamId);
    }
    /**
     * Clear cache for streamId
     */
    clearStream(streamId) {
        this.logger.debug('clearing caches matching streamId="%s"', streamId);
        // include separator so startsWith(streamid) doesn't match streamid-something
        const target = `${streamId}${SEPARATOR}`;
        const matchTarget = (s) => s.startsWith(target);
        this._getStream.clearMatching(matchTarget);
        this._isStreamPublisher.clearMatching(matchTarget);
        this._isStreamSubscriber.clearMatching(matchTarget);
    }
};
StreamRegistryCached = __decorate([
    (0, tsyringe_1.scoped)(tsyringe_1.Lifecycle.ContainerScoped),
    __param(0, (0, tsyringe_1.inject)(LoggerFactory_1.LoggerFactory)),
    __param(1, (0, tsyringe_1.inject)((0, tsyringe_1.delay)(() => StreamRegistry_1.StreamRegistry))),
    __param(2, (0, tsyringe_1.inject)(Config_1.ConfigInjectionToken)),
    __metadata("design:paramtypes", [LoggerFactory_1.LoggerFactory,
        StreamRegistry_1.StreamRegistry, Object])
], StreamRegistryCached);
exports.StreamRegistryCached = StreamRegistryCached;
//# sourceMappingURL=StreamRegistryCached.js.map