"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Subscription = void 0;
const MessageStream_1 = require("./MessageStream");
const eventemitter3_1 = __importDefault(require("eventemitter3"));
/**
 * A convenience API for managing an individual subscription.
 *
 * @category Important
 */
class Subscription extends MessageStream_1.MessageStream {
    /** @internal */
    constructor(streamPartId, loggerFactory) {
        super();
        this.streamPartId = streamPartId;
        this.eventEmitter = new eventemitter3_1.default();
        this.logger = loggerFactory.createLogger(module);
        this.onMessage.listen((msg) => {
            this.logger.debug('onMessage %j', msg.serializedContent);
        });
        this.onError.listen((err) => {
            this.eventEmitter.emit('error', err);
            this.logger.debug('onError %s', err);
        });
    }
    /**
     * Unsubscribes this subscription.
     *
     * @remarks The instance should not be used after calling this.
     */
    async unsubscribe() {
        this.end();
        await this.return();
        this.eventEmitter.removeAllListeners();
    }
    /**
     * Adds an event listener to the subscription.
     * @param eventName - event name, see {@link SubscriptionEvents} for options
     * @param listener - the callback function
     */
    on(eventName, listener) {
        this.eventEmitter.on(eventName, listener);
    }
    /**
     * Adds an event listener to the subscription that is invoked only once.
     * @param eventName - event name, see {@link SubscriptionEvents} for options
     * @param listener - the callback function
     */
    once(eventName, listener) {
        this.eventEmitter.once(eventName, listener);
    }
    /**
     * Removes an event listener from the subscription.
     * @param eventName - event name, see {@link SubscriptionEvents} for options
     * @param listener - the callback function to remove
     */
    off(eventName, listener) {
        this.eventEmitter.off(eventName, listener);
    }
}
exports.Subscription = Subscription;
//# sourceMappingURL=Subscription.js.map