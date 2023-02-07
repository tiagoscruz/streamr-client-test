import { StreamPartID } from '@streamr/protocol';
import { MessageStream } from './MessageStream';
import { Logger } from '@streamr/utils';
import EventEmitter from 'eventemitter3';
/**
 * Events emitted by {@link Subscription}.
 */
export interface SubscriptionEvents {
    /**
     * Emitted if an error occurred in the subscription.
     */
    error: (err: Error) => void;
    /**
     * Emitted when a resend is complete.
     */
    resendComplete: () => void;
}
/**
 * A convenience API for managing an individual subscription.
 *
 * @category Important
 */
export declare class Subscription extends MessageStream {
    protected readonly logger: Logger;
    readonly streamPartId: StreamPartID;
    protected eventEmitter: EventEmitter<SubscriptionEvents>;
    /**
     * Unsubscribes this subscription.
     *
     * @remarks The instance should not be used after calling this.
     */
    unsubscribe(): Promise<void>;
    /**
     * Adds an event listener to the subscription.
     * @param eventName - event name, see {@link SubscriptionEvents} for options
     * @param listener - the callback function
     */
    on<E extends keyof SubscriptionEvents>(eventName: E, listener: SubscriptionEvents[E]): void;
    /**
     * Adds an event listener to the subscription that is invoked only once.
     * @param eventName - event name, see {@link SubscriptionEvents} for options
     * @param listener - the callback function
     */
    once<E extends keyof SubscriptionEvents>(eventName: E, listener: SubscriptionEvents[E]): void;
    /**
     * Removes an event listener from the subscription.
     * @param eventName - event name, see {@link SubscriptionEvents} for options
     * @param listener - the callback function to remove
     */
    off<E extends keyof SubscriptionEvents>(eventName: E, listener: SubscriptionEvents[E]): void;
}
