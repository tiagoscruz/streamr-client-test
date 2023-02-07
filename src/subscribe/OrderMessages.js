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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderMessages = void 0;
/**
 * Makes OrderingUtil more compatible with use in pipeline.
 */
const tsyringe_1 = require("tsyringe");
const PushBuffer_1 = require("../utils/PushBuffer");
const Signal_1 = require("../utils/Signal");
const Resends_1 = require("./Resends");
const OrderingUtil_1 = __importDefault(require("./ordering/OrderingUtil"));
const LoggerFactory_1 = require("../utils/LoggerFactory");
/**
 * Wraps OrderingUtil into a PushBuffer.
 * Implements gap filling
 */
let OrderMessages = class OrderMessages {
    constructor(config, resends, streamPartId, loggerFactory) {
        this.stopSignal = Signal_1.Signal.once();
        this.done = false;
        this.resendStreams = new Set(); // holds outstanding resends for cleanup
        this.outBuffer = new PushBuffer_1.PushBuffer();
        this.inputClosed = false;
        this.enabled = true;
        this.config = config;
        this.resends = resends;
        this.streamPartId = streamPartId;
        this.logger = loggerFactory.createLogger(module);
        this.stopSignal.listen(() => {
            this.done = true;
        });
        this.onOrdered = this.onOrdered.bind(this);
        this.onGap = this.onGap.bind(this);
        this.maybeClose = this.maybeClose.bind(this);
        const { gapFillTimeout, retryResendAfter, maxGapRequests, orderMessages, gapFill } = this.config;
        this.enabled = gapFill && (maxGapRequests > 0);
        this.orderMessages = orderMessages;
        this.orderingUtil = new OrderingUtil_1.default(this.onOrdered, this.onGap, gapFillTimeout, retryResendAfter, this.enabled ? maxGapRequests : 0);
        this.orderingUtil.on('drain', this.maybeClose);
        // TODO: handle gapfill errors without closing stream or logging
        this.orderingUtil.on('error', this.maybeClose); // probably noop
    }
    async onGap(from, to, publisherId, msgChainId) {
        if (this.done || !this.enabled) {
            return;
        }
        this.logger.debug('gap detected on %j', {
            streamPartId: this.streamPartId,
            publisherId,
            msgChainId,
            from,
            to,
        });
        let resendMessageStream;
        try {
            resendMessageStream = await this.resends.range(this.streamPartId, {
                fromTimestamp: from.timestamp,
                toTimestamp: to.timestamp,
                fromSequenceNumber: from.sequenceNumber,
                toSequenceNumber: to.sequenceNumber,
                publisherId,
                msgChainId,
            });
            resendMessageStream.onFinally.listen(() => {
                this.resendStreams.delete(resendMessageStream);
            });
            this.resendStreams.add(resendMessageStream);
            if (this.done) {
                return;
            }
            for await (const streamMessage of resendMessageStream.getStreamMessages()) {
                if (this.done) {
                    return;
                }
                this.orderingUtil.add(streamMessage);
            }
        }
        catch (err) {
            if (this.done) {
                return;
            }
            if (err.code === 'NO_STORAGE_NODES') {
                // ignore NO_STORAGE_NODES errors
                // if stream has no storage we can't do resends
                this.enabled = false;
                this.orderingUtil.disable();
            }
            else {
                this.outBuffer.endWrite(err);
            }
        }
        finally {
            if (resendMessageStream != null) {
                this.resendStreams.delete(resendMessageStream);
            }
        }
    }
    onOrdered(orderedMessage) {
        if (this.outBuffer.isDone() || this.done) {
            return;
        }
        this.outBuffer.push(orderedMessage);
    }
    stop() {
        return this.stopSignal.trigger();
    }
    maybeClose() {
        // we can close when:
        // input has closed (i.e. all messages sent)
        // AND
        // no gaps are pending
        // AND
        // gaps have been filled or failed
        // NOTE ordering util cannot have gaps if queue is empty
        if (this.inputClosed && this.orderingUtil.isEmpty()) {
            this.outBuffer.endWrite();
        }
    }
    async addToOrderingUtil(src) {
        try {
            for await (const msg of src) {
                this.orderingUtil.add(msg);
            }
            this.inputClosed = true;
            this.maybeClose();
        }
        catch (err) {
            this.outBuffer.endWrite(err);
        }
    }
    transform() {
        return async function* Transform(src) {
            if (!this.orderMessages) {
                yield* src;
                return;
            }
            try {
                this.addToOrderingUtil(src);
                yield* this.outBuffer;
            }
            finally {
                this.done = true;
                this.orderingUtil.clearGaps();
                this.resendStreams.forEach((s) => s.end());
                this.resendStreams.clear();
                this.orderingUtil.clearGaps();
            }
        }.bind(this);
    }
};
OrderMessages = __decorate([
    (0, tsyringe_1.injectable)(),
    __metadata("design:paramtypes", [Object, Resends_1.Resends, String, LoggerFactory_1.LoggerFactory])
], OrderMessages);
exports.OrderMessages = OrderMessages;
//# sourceMappingURL=OrderMessages.js.map