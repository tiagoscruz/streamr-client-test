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
exports.ResendSubscription = void 0;
const tsyringe_1 = require("tsyringe");
const Subscription_1 = require("./Subscription");
const protocol_1 = require("@streamr/protocol");
const Config_1 = require("../Config");
const OrderMessages_1 = require("./OrderMessages");
const Resends_1 = require("./Resends");
const LoggerFactory_1 = require("../utils/LoggerFactory");
let ResendSubscription = class ResendSubscription extends Subscription_1.Subscription {
    /** @internal */
    constructor(streamPartId, resendOptions, resends, loggerFactory, config) {
        super(streamPartId, loggerFactory);
        this.resendOptions = resendOptions;
        this.resends = resends;
        this.orderMessages = new OrderMessages_1.OrderMessages(config, resends, streamPartId, loggerFactory);
        this.pipe(this.resendThenRealtime.bind(this));
        this.pipe(this.orderMessages.transform());
        this.onBeforeFinally.listen(async () => {
            this.orderMessages.stop();
        });
    }
    async getResent() {
        const resentMsgs = await this.resends.resend(this.streamPartId, this.resendOptions);
        this.onBeforeFinally.listen(async () => {
            resentMsgs.end();
            await resentMsgs.return();
        });
        return resentMsgs;
    }
    async *resendThenRealtime(src) {
        try {
            yield* (await this.getResent()).getStreamMessages();
        }
        catch (err) {
            if (err.code === 'NO_STORAGE_NODES') {
                const streamId = protocol_1.StreamPartIDUtils.getStreamID(this.streamPartId);
                this.logger.warn(`no storage assigned: ${streamId}`);
            }
            else {
                await this.handleError(err);
            }
        }
        this.eventEmitter.emit('resendComplete');
        yield* src;
    }
};
ResendSubscription = __decorate([
    __param(4, (0, tsyringe_1.inject)(Config_1.ConfigInjectionToken)),
    __metadata("design:paramtypes", [String, Object, Resends_1.Resends,
        LoggerFactory_1.LoggerFactory, Object])
], ResendSubscription);
exports.ResendSubscription = ResendSubscription;
//# sourceMappingURL=ResendSubscription.js.map