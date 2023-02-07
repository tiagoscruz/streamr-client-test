export type SignalListener<T extends any[]> = (...args: T) => (unknown | Promise<unknown>);
type SignalListenerWrap<T extends any[]> = SignalListener<T> & {
    listener: SignalListener<T>;
};
export declare enum TRIGGER_TYPE {
    ONCE = "ONCE",
    ONE = "ONE",
    QUEUE = "QUEUE",
    PARALLEL = "PARALLEL"
}
/**
 * Like an event emitter, but for a single event.  Listeners are executed
 * in-order, in an async sequence.  Any errors in listerns errors will be
 * thrown by trigger() as an AggregateError at end.
 *
 * Allows attaching onEvent properties to classes e.g.
 * ```ts
 * class Messages {
 *     onMessage = Signal.create<Message>(this)
 *     async push(msg: Message) {
 *         await this.onMessage.trigger(msg)
 *     }
 * }
 *
 * const msgs = new Messages()
 * msgs.onMessage((msg) => console.log(msg))
 * await msgs.push(new Message())
 * ```
 */
export declare class Signal<ArgsType extends any[] = []> {
    static TRIGGER_TYPE: typeof TRIGGER_TYPE;
    /**
     *  Create a Signal's listen function with signal utility methods attached.
     *  See example above.
     */
    static create<ArgsType extends any[] = []>(triggerType?: TRIGGER_TYPE): Signal<ArgsType>;
    /**
     * Will only trigger once.  Adding listeners after already fired will fire
     * listener immediately.  Calling trigger after already triggered is a
     * noop.
     */
    static once<ArgsType extends any[] = []>(): Signal<ArgsType>;
    /**
     * Only one pending trigger call at a time.  Calling trigger again while
     * listeners are pending will not trigger listeners again, and will resolve
     * when listeners are resolved.
     */
    static one<ArgsType extends any[] = []>(): Signal<ArgsType>;
    /**
     * Only one pending trigger call at a time, but calling trigger again while
     * listeners are pending will enqueue the trigger until after listeners are
     * resolved.
     */
    static queue<ArgsType extends any[] = []>(): Signal<ArgsType>;
    /**
     * Trigger does not wait for pending trigger calls at all.
     * Listener functions are still executed in async series,
     * but multiple triggers can be active in parallel.
     */
    static parallel<ArgsType extends any[] = []>(): Signal<ArgsType>;
    protected listeners: (SignalListener<ArgsType> | SignalListenerWrap<ArgsType>)[];
    protected isEnded: boolean;
    protected triggerCountValue: number;
    protected triggerType: TRIGGER_TYPE;
    constructor(triggerType?: TRIGGER_TYPE);
    triggerCount(): number;
    lastValue: ArgsType | undefined;
    /**
     * No more events.
     */
    end: (...args: ArgsType) => void;
    /**
     * Promise that resolves on next trigger.
     */
    wait(): Promise<ArgsType[0]>;
    getLastValue(): Promise<ArgsType>;
    /**
     * Attach a callback listener to this Signal.
     */
    listen(): Promise<ArgsType[0]>;
    listen(cb: SignalListener<ArgsType>): this;
    once(): Promise<ArgsType[0]>;
    once(cb: SignalListener<ArgsType>): this;
    countListeners(): number;
    /**
     * Remove a callback listener from this Signal.
     */
    unlisten(cb: SignalListener<ArgsType>): this;
    protected execTrigger(...args: ArgsType): Promise<void>;
    currentTask: Promise<void> | undefined;
    /**
     * Trigger the signal with optional value, like emitter.emit.
     */
    trigger(...args: ArgsType): Promise<void>;
    [Symbol.asyncIterator](): AsyncGenerator<Awaited<ArgsType[0]>, void, unknown>;
}
/**
 * Special Signal for Errors.
 * Trigger this Signal to decide whether to suppress or throw err.
 * Suppress error if listeners don't rethrow
 * Throws on trigger if no listeners.
 * Won't trigger listeners for same Error instance more than once.
 */
export declare class ErrorSignal<ArgsType extends [Error] = [Error]> extends Signal<ArgsType> {
    protected seenErrors: WeakSet<Error>;
    protected ignoredErrors: WeakSet<Error>;
    private minListeners;
    protected execTrigger(...args: ArgsType): Promise<void>;
    trigger(...args: ArgsType): Promise<void>;
}
export {};
