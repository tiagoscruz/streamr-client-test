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
exports.Validator = void 0;
/**
 * Validation Wrapper
 */
const tsyringe_1 = require("tsyringe");
const promises_1 = require("./utils/promises");
const StreamRegistryCached_1 = require("./registry/StreamRegistryCached");
const StreamMessageValidator_1 = __importDefault(require("./StreamMessageValidator"));
const signingUtils_1 = require("./utils/signingUtils");
/**
 * Wrap StreamMessageValidator in a way that ensures it can validate in parallel but
 * validation is guaranteed to resolve in the same order they were called
 * Handles caching remote calls
 */
let Validator = class Validator extends StreamMessageValidator_1.default {
    constructor(streamRegistryCached) {
        super({
            getPartitionCount: async (streamId) => {
                const stream = await streamRegistryCached.getStream(streamId);
                return stream.getMetadata().partitions;
            },
            isPublisher: (publisherId, streamId) => {
                return streamRegistryCached.isStreamPublisher(streamId, publisherId);
            },
            isSubscriber: (ethAddress, streamId) => {
                return streamRegistryCached.isStreamSubscriber(streamId, ethAddress);
            },
            verify: (address, payload, signature) => {
                return (0, signingUtils_1.verify)(address, payload, signature);
            }
        });
        this.isStopped = false;
        this.orderedValidate = (0, promises_1.pOrderedResolve)(async (msg) => {
            if (this.isStopped) {
                return;
            }
            // In all other cases validate using the validator
            // will throw with appropriate validation failure
            await this.doValidation(msg).catch((err) => {
                if (this.isStopped) {
                    return;
                }
                if (!err.streamMessage) {
                    err.streamMessage = msg;
                }
                throw err;
            });
        });
        this.doValidation = super.validate.bind(this);
    }
    async validate(msg) {
        if (this.isStopped) {
            return;
        }
        await this.orderedValidate(msg);
    }
    stop() {
        this.isStopped = true;
        this.orderedValidate.clear();
    }
};
Validator = __decorate([
    (0, tsyringe_1.scoped)(tsyringe_1.Lifecycle.ContainerScoped),
    __param(0, (0, tsyringe_1.inject)((0, tsyringe_1.delay)(() => StreamRegistryCached_1.StreamRegistryCached))),
    __metadata("design:paramtypes", [StreamRegistryCached_1.StreamRegistryCached])
], Validator);
exports.Validator = Validator;
//# sourceMappingURL=Validator.js.map