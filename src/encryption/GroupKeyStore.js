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
exports.GroupKeyStore = void 0;
const tsyringe_1 = require("tsyringe");
const path_1 = require("path");
const GroupKey_1 = require("./GroupKey");
const Authentication_1 = require("../Authentication");
const events_1 = require("../events");
const Persistence_1 = require("../utils/persistence/Persistence");
const ServerPersistence_1 = __importDefault(require("../utils/persistence/ServerPersistence"));
const promises_1 = require("../utils/promises");
const LoggerFactory_1 = require("../utils/LoggerFactory");
let GroupKeyStore = class GroupKeyStore {
    constructor(loggerFactory, authentication, eventEmitter, persistence) {
        this.authentication = authentication;
        this.eventEmitter = eventEmitter;
        this.logger = loggerFactory.createLogger(module);
        this.ensureInitialized = (0, promises_1.pOnce)(async () => {
            const clientId = await this.authentication.getAddress();
            this.persistence = persistence || new ServerPersistence_1.default({
                loggerFactory,
                tableName: 'GroupKeys',
                valueColumnName: 'groupKey',
                clientId,
                migrationsPath: (0, path_1.join)(__dirname, 'migrations')
            });
        });
    }
    async get(keyId, streamId) {
        await this.ensureInitialized();
        const value = await this.persistence.get(keyId, streamId);
        if (value === undefined) {
            return undefined;
        }
        return new GroupKey_1.GroupKey(keyId, Buffer.from(value, 'hex'));
    }
    async add(key, streamId) {
        await this.ensureInitialized();
        this.logger.debug('add key %s', key.id);
        await this.persistence.set(key.id, Buffer.from(key.data).toString('hex'), streamId);
        this.eventEmitter.emit('addGroupKey', key);
    }
    async stop() {
        await this.persistence?.close();
    }
};
GroupKeyStore = __decorate([
    (0, tsyringe_1.scoped)(tsyringe_1.Lifecycle.ContainerScoped),
    __param(0, (0, tsyringe_1.inject)(LoggerFactory_1.LoggerFactory)),
    __param(1, (0, tsyringe_1.inject)(Authentication_1.AuthenticationInjectionToken)),
    __param(2, (0, tsyringe_1.inject)(events_1.StreamrClientEventEmitter)),
    __param(3, (0, tsyringe_1.inject)(Persistence_1.PersistenceInjectionToken)),
    __metadata("design:paramtypes", [LoggerFactory_1.LoggerFactory, Object, events_1.StreamrClientEventEmitter, Object])
], GroupKeyStore);
exports.GroupKeyStore = GroupKeyStore;
//# sourceMappingURL=GroupKeyStore.js.map