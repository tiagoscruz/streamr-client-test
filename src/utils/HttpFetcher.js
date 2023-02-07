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
exports.HttpFetcher = void 0;
const tsyringe_1 = require("tsyringe");
const Config_1 = require("../Config");
const node_fetch_1 = __importDefault(require("node-fetch"));
const LoggerFactory_1 = require("./LoggerFactory");
let HttpFetcher = class HttpFetcher {
    constructor(loggerFactory, config) {
        this.config = config;
        this.logger = loggerFactory.createLogger(module);
    }
    fetch(url, init) {
        // eslint-disable-next-line no-underscore-dangle
        const timeout = this.config._timeouts.httpFetchTimeout;
        this.logger.debug('fetching %s (timeout %d ms)', url, timeout);
        return (0, node_fetch_1.default)(url, {
            timeout,
            ...init
        });
    }
};
HttpFetcher = __decorate([
    (0, tsyringe_1.scoped)(tsyringe_1.Lifecycle.ContainerScoped),
    __param(0, (0, tsyringe_1.inject)(LoggerFactory_1.LoggerFactory)),
    __param(1, (0, tsyringe_1.inject)(Config_1.ConfigInjectionToken)),
    __metadata("design:paramtypes", [LoggerFactory_1.LoggerFactory, Object])
], HttpFetcher);
exports.HttpFetcher = HttpFetcher;
//# sourceMappingURL=HttpFetcher.js.map