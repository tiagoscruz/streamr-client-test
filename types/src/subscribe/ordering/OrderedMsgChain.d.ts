import { EventEmitter } from 'events';
import StrictEventEmitter from 'strict-event-emitter-types';
import { StreamMessage, MessageRef } from '@streamr/protocol';
import { EthereumAddress } from '@streamr/utils';
/**
 * Set of StreamMessages, unique by serialized msgRef i.e. timestamp + sequence number.
 */
declare class StreamMessageSet {
    msgMap: Map<string, StreamMessage<unknown>>;
    has(streamMessage: StreamMessage): boolean;
    /**
     * Get StreamMessage associated with this msgRef
     */
    get(msgRef: MessageRef): StreamMessage<unknown> | undefined;
    delete(streamMessage: StreamMessage): boolean;
    add(streamMessage: StreamMessage): this | Map<string, StreamMessage<unknown>>;
    size(): number;
}
/**
 * Ordered queue of StreamMessages.
 * Deduplicated by serialized msgRef.
 */
declare class MsgChainQueue {
    /**
     * Ordered message refs
     */
    private queue;
    /**
     * Mapping from msgRef to message.
     */
    private pendingMsgs;
    /**
     * Peek at next message in-order.
     */
    peek(): StreamMessage<unknown> | undefined;
    /**
     * True if queue already has a message with this message ref.
     */
    has(streamMessage: StreamMessage): boolean;
    /**
     * Push new item into the queue.
     * Ignores duplicates.
     */
    push(streamMessage: StreamMessage): void;
    /**
     * Remove next item from queue and return it.
     */
    pop(): StreamMessage | undefined;
    /**
     * True if there are no items in the queue.
     */
    isEmpty(): boolean;
    /**
     * Number of items in queue.
     */
    size(): number;
}
export type MessageHandler = (msg: StreamMessage) => void;
export type GapHandler = (from: MessageRef, to: MessageRef, publisherId: EthereumAddress, msgChainId: string) => void | Promise<void>;
/**
 * Strict types for EventEmitter interface.
 */
interface Events {
    /**
     * Message was marked and is being skipped.
     * Does not fire if maxGapRequests = 0
     */
    skip: MessageHandler;
    /**
     * Queue was drained after something was in it.
     */
    drain: (numMessages: number) => void;
    /**
     * Probably a GapFillFailedError.
     */
    error: (error: Error) => void;
}
export declare const MsgChainEmitter: new () => StrictEventEmitter<EventEmitter, Events>;
declare class OrderedMsgChain extends MsgChainEmitter {
    id: number;
    queue: MsgChainQueue;
    lastOrderedMsgRef: MessageRef | null;
    hasPendingGap: boolean;
    gapRequestCount: number;
    maxGapRequests: number;
    publisherId: EthereumAddress;
    msgChainId: string;
    inOrderHandler: MessageHandler;
    gapHandler: GapHandler;
    propagationTimeout: number;
    resendTimeout: number;
    nextGaps: ReturnType<typeof setTimeout> | null;
    markedExplicitly: StreamMessageSet;
    constructor(publisherId: EthereumAddress, msgChainId: string, inOrderHandler: MessageHandler, gapHandler: GapHandler, propagationTimeout?: number, resendTimeout?: number, maxGapRequests?: number);
    /**
     * Messages are stale if they are already enqueued or last ordered message is newer.
     */
    isStaleMessage(streamMessage: StreamMessage): boolean;
    /**
     * Add message to queue.
     */
    add(unorderedStreamMessage: StreamMessage): void;
    /**
     * Mark a message to have it be treated as the next message & not trigger gap fill
     */
    markMessageExplicitly(streamMessage: StreamMessage): void;
    /**
     * Adds message to set of marked messages.
     * Does nothing and returns false if message is stale.
     */
    private markMessage;
    /**
     * Cancel any outstanding gap fill request.
     */
    clearGap(): void;
    disable(): void;
    isGapHandlingEnabled(): boolean;
    /**
     * True if queue is empty.
     */
    isEmpty(): boolean;
    /**
     * Number of enqueued messages.
     */
    size(): number;
    /**
     * True if the next queued message is the next message in the chain.
     * Always true for first message and unchained messages i.e. messages without a prevMsgRef.
     */
    private hasNextMessageInChain;
    /**
     * Keep popping messages until we hit a gap or run out of messages.
     */
    private checkQueue;
    /**
     * Remove next message from queue and run it through inOrderHandler if valid.
     */
    private pop;
    /**
     * Schedule a requestGapFill call.
     */
    private scheduleGap;
    /**
     * Call gapHandler until run out of gapRequests.
     * Failure emits an error and sets up to continue processing enqueued messages after the gap.
     */
    private requestGapFill;
    private onGapFillsExhausted;
    debugStatus(): void;
}
export default OrderedMsgChain;
