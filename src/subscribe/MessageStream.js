"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageStream = void 0;
const PushPipeline_1 = require("../utils/PushPipeline");
const Message_1 = require("./../Message");
const lodash_1 = require("lodash");
/**
 * Provides asynchronous iteration with
 * {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for-await...of | for await .. of}.
 */
class MessageStream {
    /** @internal */
    // eslint-disable-next-line @typescript-eslint/no-useless-constructor
    constructor() {
        this.pipeline = new PushPipeline_1.PushPipeline();
        /*
         * The methods below are used to control or observe the pipeline.
         * TODO We should refactor the pipeline handling so that a MessageStream producer
         * (e.g. SubscriptionSession or Resends) creates a PushPipeline (or similar) data structure,
         * and calls these methods for that pipeline. Here in MessageStream we'd see the object
         * as Pipeline interface. Ideally here in MessageStream we'd use the pipeline only to get
         * an async iterator when [Symbol.asyncIterator]() is called for this MessageStream.
         * When the we have done the refactoring, all/most other methods below could be removed.
         */
        /** @internal */
        this.onFinally = this.pipeline.onFinally;
        /** @internal */
        this.onBeforeFinally = this.pipeline.onBeforeFinally;
        /** @internal */
        this.onError = this.pipeline.onError;
        /** @internal */
        this.onMessage = this.pipeline.onMessage;
    }
    /**
     * Attach a legacy onMessage handler and consume if necessary.
     * onMessage is passed parsed content as first arument, and streamMessage as second argument.
     * @internal
     */
    useLegacyOnMessageHandler(onMessage) {
        this.pipeline.onMessage.listen(async (streamMessage) => {
            const msg = (0, Message_1.convertStreamMessageToMessage)(streamMessage);
            await onMessage(msg.content, (0, lodash_1.omit)(msg, 'content'));
        });
        this.pipeline.flow();
        return this;
    }
    /** @internal */
    getStreamMessages() {
        return this.pipeline;
    }
    async *[Symbol.asyncIterator]() {
        for await (const msg of this.pipeline) {
            yield (0, Message_1.convertStreamMessageToMessage)(msg);
        }
    }
    /** @internal */
    flow() {
        this.pipeline.flow();
    }
    /** @internal */
    async push(item) {
        await this.pipeline.push(item);
    }
    /** @internal */
    pipe(fn) {
        return this.pipeline.pipe(fn);
    }
    // used only in tests
    /** @internal */
    pipeBefore(fn) {
        return this.pipeline.pipeBefore(fn);
    }
    /** @internal */
    map(fn) {
        return this.pipeline.map(fn);
    }
    /** @internal */
    forEach(fn) {
        return this.pipeline.forEach(fn);
    }
    // used only in tests
    /** @internal */
    async consume(fn) {
        await this.pipeline.consume(fn);
    }
    // used only in tests
    /** @internal */
    onConsumed(fn) {
        this.pipeline.onConsumed(fn);
    }
    /** @internal */
    async pull(source) {
        return this.pipeline.pull(source);
    }
    /** @internal */
    async handleError(err) {
        await this.pipeline.handleError(err);
    }
    /** @internal */
    end(err) {
        this.pipeline.end(err);
    }
    /** @internal */
    endWrite(err) {
        this.pipeline.endWrite(err);
    }
    /** @internal */
    isDone() {
        return this.pipeline.isDone();
    }
    /** @internal */
    return() {
        return this.pipeline.return();
    }
    // used only in tests
    /** @internal */
    throw(err) {
        return this.pipeline.throw(err);
    }
}
exports.MessageStream = MessageStream;
//# sourceMappingURL=MessageStream.js.map