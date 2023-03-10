"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MsgChainEmitter = void 0;
const events_1 = require("events");
const heap_1 = __importDefault(require("heap"));
const protocol_1 = require("@streamr/protocol");
const GapFillFailedError_1 = __importDefault(require("./GapFillFailedError"));
const utils_1 = require("@streamr/utils");
function toMsgRefId(streamMessage) {
    return streamMessage.getMessageRef().serialize();
}
/**
 * Set of StreamMessages, unique by serialized msgRef i.e. timestamp + sequence number.
 */
class StreamMessageSet {
    constructor() {
        this.msgMap = new Map();
    }
    has(streamMessage) {
        return this.msgMap.has(toMsgRefId(streamMessage));
    }
    /**
     * Get StreamMessage associated with this msgRef
     */
    get(msgRef) {
        return this.msgMap.get(msgRef.serialize());
    }
    delete(streamMessage) {
        return this.msgMap.delete(toMsgRefId(streamMessage));
    }
    add(streamMessage) {
        if (!this.has(streamMessage)) {
            return this.msgMap.set(toMsgRefId(streamMessage), streamMessage);
        }
        return this;
    }
    size() {
        return this.msgMap.size;
    }
}
/**
 * Ordered queue of StreamMessages.
 * Deduplicated by serialized msgRef.
 */
class MsgChainQueue {
    constructor() {
        /**
         * Ordered message refs
         */
        this.queue = new heap_1.default((msg1, msg2) => {
            return msg1.compareTo(msg2);
        });
        /**
         * Mapping from msgRef to message.
         */
        this.pendingMsgs = new StreamMessageSet();
    }
    /**
     * Peek at next message in-order.
     */
    peek() {
        if (this.isEmpty()) {
            return;
        }
        const ref = this.queue.peek();
        return this.pendingMsgs.get(ref);
    }
    /**
     * True if queue already has a message with this message ref.
     */
    has(streamMessage) {
        // prevent duplicates
        return this.pendingMsgs.has(streamMessage);
    }
    /**
     * Push new item into the queue.
     * Ignores duplicates.
     */
    push(streamMessage) {
        // prevent duplicates
        if (this.has(streamMessage)) {
            return;
        }
        this.pendingMsgs.add(streamMessage);
        const msgRef = streamMessage.getMessageRef();
        this.queue.push(msgRef);
    }
    /**
     * Remove next item from queue and return it.
     */
    pop() {
        if (this.isEmpty()) {
            return;
        }
        const streamMessage = this.peek();
        if (!streamMessage) {
            return;
        }
        this.queue.pop();
        this.pendingMsgs.delete(streamMessage);
        return streamMessage;
    }
    /**
     * True if there are no items in the queue.
     */
    isEmpty() {
        return this.queue.empty();
    }
    /**
     * Number of items in queue.
     */
    size() {
        return this.queue.size();
    }
}
// eslint-disable-next-line @typescript-eslint/prefer-function-type
exports.MsgChainEmitter = events_1.EventEmitter;
// The time it takes to propagate messages in the network. If we detect a gap, we first wait this amount of time because the missing
// messages might still be propagated.
const DEFAULT_PROPAGATION_TIMEOUT = 5000;
// The round trip time it takes to request a resend and receive the answer. If the messages are still missing after the propagation
// delay, we request a resend and periodically wait this amount of time before requesting it again.
const DEFAULT_RESEND_TIMEOUT = 5000;
const MAX_GAP_REQUESTS = 10;
let ID = 0;
const logger = new utils_1.Logger(module);
class OrderedMsgChain extends exports.MsgChainEmitter {
    constructor(publisherId, msgChainId, inOrderHandler, gapHandler, propagationTimeout = DEFAULT_PROPAGATION_TIMEOUT, resendTimeout = DEFAULT_RESEND_TIMEOUT, maxGapRequests = MAX_GAP_REQUESTS) {
        super();
        this.queue = new MsgChainQueue();
        this.lastOrderedMsgRef = null;
        this.hasPendingGap = false;
        this.gapRequestCount = 0;
        this.nextGaps = null;
        this.markedExplicitly = new StreamMessageSet();
        ID += 1;
        this.id = ID;
        this.publisherId = publisherId;
        this.msgChainId = msgChainId;
        this.inOrderHandler = inOrderHandler;
        this.gapHandler = gapHandler;
        this.lastOrderedMsgRef = null;
        this.propagationTimeout = propagationTimeout;
        this.resendTimeout = resendTimeout;
        this.maxGapRequests = maxGapRequests;
    }
    /**
     * Messages are stale if they are already enqueued or last ordered message is newer.
     */
    isStaleMessage(streamMessage) {
        const msgRef = streamMessage.getMessageRef();
        return !!(
        // already enqueued
        this.queue.has(streamMessage) || (this.lastOrderedMsgRef
            // or older/equal to last ordered msgRef
            && msgRef.compareTo(this.lastOrderedMsgRef) <= 0));
    }
    /**
     * Add message to queue.
     */
    add(unorderedStreamMessage) {
        if (this.isStaleMessage(unorderedStreamMessage)) {
            const msgRef = unorderedStreamMessage.getMessageRef();
            // Prevent double-processing of messages for any reason
            logger.trace('Ignoring message: %j. Message was already enqueued or we already processed a newer message: %j.', msgRef, this.lastOrderedMsgRef);
            return;
        }
        // gap handling disabled
        if (!this.isGapHandlingEnabled()) {
            this.markMessage(unorderedStreamMessage);
        }
        this.queue.push(unorderedStreamMessage);
        this.checkQueue();
    }
    /**
     * Mark a message to have it be treated as the next message & not trigger gap fill
     */
    markMessageExplicitly(streamMessage) {
        // only add if not stale
        if (this.markMessage(streamMessage)) {
            this.add(streamMessage);
        }
    }
    /**
     * Adds message to set of marked messages.
     * Does nothing and returns false if message is stale.
     */
    markMessage(streamMessage) {
        if (!streamMessage || this.isStaleMessage(streamMessage)) {
            // do nothing if already past/handled this message
            return false;
        }
        if (this.isGapHandlingEnabled()) {
            logger.trace('marking message %j', streamMessage.getMessageRef());
        }
        this.markedExplicitly.add(streamMessage);
        return true;
    }
    /**
     * Cancel any outstanding gap fill request.
     */
    clearGap() {
        if (this.hasPendingGap) {
            logger.trace('clearGap');
        }
        this.hasPendingGap = false;
        clearTimeout(this.nextGaps);
        this.nextGaps = null;
    }
    disable() {
        this.maxGapRequests = 0;
        this.clearGap();
        this.checkQueue();
    }
    isGapHandlingEnabled() {
        return this.maxGapRequests > 0;
    }
    /**
     * True if queue is empty.
     */
    isEmpty() {
        return this.queue.isEmpty();
    }
    /**
     * Number of enqueued messages.
     */
    size() {
        return this.queue.size();
    }
    /**
     * True if the next queued message is the next message in the chain.
     * Always true for first message and unchained messages i.e. messages without a prevMsgRef.
     */
    hasNextMessageInChain() {
        const streamMessage = this.queue.peek();
        if (!streamMessage) {
            return false;
        }
        const { prevMsgRef } = streamMessage;
        // is first message
        if (this.lastOrderedMsgRef === null) {
            return true;
        }
        if (prevMsgRef !== null) {
            // if has prev, message is chained: ensure prev points at last ordered message
            return prevMsgRef.compareTo(this.lastOrderedMsgRef) === 0;
        }
        else {
            // without prev, message is unchained.
            // only first message in chain should have no prev
            // This assumes it's the next message if it's newer
            // and relies on queue pre-sorting messages
            return streamMessage.getMessageRef().compareTo(this.lastOrderedMsgRef) > 0;
        }
    }
    /**
     * Keep popping messages until we hit a gap or run out of messages.
     */
    checkQueue() {
        let processedMessages = 0;
        while (this.hasNextMessageInChain()) {
            processedMessages += 1;
            this.pop();
        }
        // if queue not empty then we have a gap
        if (!this.queue.isEmpty()) {
            this.scheduleGap();
            return;
        }
        // emit drain after clearing a block. If only a single item was in the
        // queue, the queue was never blocked, so it doesn't need to 'drain'.
        if (processedMessages > 1) {
            logger.trace('queue drained %d %j', processedMessages, this.lastOrderedMsgRef);
            this.clearGap();
            this.emit('drain', processedMessages);
        }
    }
    /**
     * Remove next message from queue and run it through inOrderHandler if valid.
     */
    pop() {
        const msg = this.queue.pop();
        if (!msg) {
            return;
        }
        this.lastOrderedMsgRef = msg.getMessageRef();
        try {
            if (this.markedExplicitly.has(msg)) {
                this.markedExplicitly.delete(msg);
                if (this.isGapHandlingEnabled()) {
                    logger.trace('skipping message %j', msg.getMessageRef());
                    this.emit('skip', msg);
                    return msg;
                }
            }
            this.inOrderHandler(msg);
        }
        catch (err) {
            this.emit('error', err);
        }
        return msg;
    }
    /**
     * Schedule a requestGapFill call.
     */
    scheduleGap() {
        if (this.hasPendingGap) {
            return;
        }
        this.gapRequestCount = 0;
        this.hasPendingGap = true;
        if (!this.isGapHandlingEnabled()) {
            this.onGapFillsExhausted();
            return;
        }
        logger.trace('scheduleGap in %d ms', this.propagationTimeout);
        const nextGap = (timeout) => {
            clearTimeout(this.nextGaps);
            this.nextGaps = setTimeout(async () => {
                if (!this.hasPendingGap) {
                    return;
                }
                await this.requestGapFill();
                if (!this.hasPendingGap) {
                    return;
                }
                nextGap(this.resendTimeout);
            }, timeout);
        };
        nextGap(this.propagationTimeout);
    }
    /**
     * Call gapHandler until run out of gapRequests.
     * Failure emits an error and sets up to continue processing enqueued messages after the gap.
     */
    async requestGapFill() {
        if (!this.hasPendingGap || this.isEmpty()) {
            return;
        }
        const msg = this.queue.peek();
        const { lastOrderedMsgRef } = this;
        if (!msg || !lastOrderedMsgRef) {
            return;
        }
        // Note: msg will always have a prevMsgRef at this point. First message
        // & unchained messages won't trigger gapfill i.e. Only chained
        // messages (messages with a prevMsgRef) can block queue processing.
        // Unchained messages arriving after queue is blocked will get
        // processed immediately if they sort earlier than the blocking message
        // or they will get queued behind the chained message and will be
        // processed unconditionally as soon as the queue is unblocked.
        const to = msg.prevMsgRef;
        const from = new protocol_1.MessageRef(lastOrderedMsgRef.timestamp, lastOrderedMsgRef.sequenceNumber + 1);
        const { gapRequestCount, maxGapRequests } = this;
        if (gapRequestCount < maxGapRequests) {
            logger.trace('requestGapFill %d of %d: %j', gapRequestCount + 1, maxGapRequests, {
                from,
                to,
            });
            this.gapRequestCount += 1;
            try {
                await this.gapHandler(from, to, this.publisherId, this.msgChainId);
            }
            catch (err) {
                this.emit('error', err);
            }
        }
        else {
            this.onGapFillsExhausted();
        }
    }
    onGapFillsExhausted() {
        if (!this.hasPendingGap || this.isEmpty()) {
            return;
        }
        const { maxGapRequests } = this;
        const msg = this.queue.peek();
        const { lastOrderedMsgRef } = this;
        if (!msg || !lastOrderedMsgRef) {
            return;
        }
        const to = msg.prevMsgRef;
        const from = new protocol_1.MessageRef(lastOrderedMsgRef.timestamp, lastOrderedMsgRef.sequenceNumber + 1);
        if (this.isGapHandlingEnabled()) {
            logger.trace('requestGapFill failed after %d attempts: %o', maxGapRequests, {
                from,
                to,
            });
            this.debugStatus();
        }
        // skip gap, allow queue processing to continue
        this.lastOrderedMsgRef = msg.getPreviousMessageRef();
        if (this.isGapHandlingEnabled()) {
            this.emit('error', new GapFillFailedError_1.default(from, to, this.publisherId, this.msgChainId, maxGapRequests));
        }
        this.clearGap();
        // keep processing
        this.checkQueue();
    }
    debugStatus() {
        logger.trace('Up to %j: %j', this.lastOrderedMsgRef, {
            gapRequestCount: this.gapRequestCount,
            maxGapRequests: this.maxGapRequests,
            size: this.queue.size(),
            isEmpty: this.isEmpty(),
            hasPendingGap: this.hasPendingGap,
            markedExplicitly: this.markedExplicitly.size()
        });
    }
}
exports.default = OrderedMsgChain;
//# sourceMappingURL=OrderedMsgChain.js.map