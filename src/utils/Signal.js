"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorSignal = exports.Signal = exports.TRIGGER_TYPE = void 0;
const promises_1 = require("./promises");
var TRIGGER_TYPE;
(function (TRIGGER_TYPE) {
    TRIGGER_TYPE["ONCE"] = "ONCE";
    TRIGGER_TYPE["ONE"] = "ONE";
    TRIGGER_TYPE["QUEUE"] = "QUEUE";
    TRIGGER_TYPE["PARALLEL"] = "PARALLEL";
})(TRIGGER_TYPE = exports.TRIGGER_TYPE || (exports.TRIGGER_TYPE = {}));
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
class Signal {
    /**
     *  Create a Signal's listen function with signal utility methods attached.
     *  See example above.
     */
    static create(triggerType = TRIGGER_TYPE.PARALLEL) {
        return new this(triggerType);
    }
    /**
     * Will only trigger once.  Adding listeners after already fired will fire
     * listener immediately.  Calling trigger after already triggered is a
     * noop.
     */
    static once() {
        return this.create(TRIGGER_TYPE.ONCE);
    }
    /**
     * Only one pending trigger call at a time.  Calling trigger again while
     * listeners are pending will not trigger listeners again, and will resolve
     * when listeners are resolved.
     */
    static one() {
        return this.create(TRIGGER_TYPE.ONE);
    }
    /**
     * Only one pending trigger call at a time, but calling trigger again while
     * listeners are pending will enqueue the trigger until after listeners are
     * resolved.
     */
    static queue() {
        return this.create(TRIGGER_TYPE.QUEUE);
    }
    /**
     * Trigger does not wait for pending trigger calls at all.
     * Listener functions are still executed in async series,
     * but multiple triggers can be active in parallel.
     */
    static parallel() {
        return this.create(TRIGGER_TYPE.PARALLEL);
    }
    constructor(triggerType = TRIGGER_TYPE.PARALLEL) {
        this.listeners = [];
        this.isEnded = false;
        this.triggerCountValue = 0;
        /**
         * No more events.
         */
        this.end = (...args) => {
            this.lastValue = args;
            this.isEnded = true;
        };
        this.triggerType = triggerType;
        this.trigger = Function.prototype.bind.call(this.trigger, this);
        switch (triggerType) {
            case TRIGGER_TYPE.ONCE: {
                this.trigger = (0, promises_1.pOnce)(this.trigger);
                break;
            }
            case TRIGGER_TYPE.QUEUE: {
                this.trigger = (0, promises_1.pLimitFn)(this.trigger);
                break;
            }
            case TRIGGER_TYPE.ONE: {
                this.trigger = (0, promises_1.pOne)(this.trigger);
                break;
            }
            case TRIGGER_TYPE.PARALLEL: {
                // no special handling
                break;
            }
            default: {
                throw new Error(`unknown trigger type: ${triggerType}`);
            }
        }
    }
    triggerCount() {
        return this.triggerCountValue;
    }
    /**
     * Promise that resolves on next trigger.
     */
    wait() {
        return new Promise((resolve) => {
            this.once((...args) => resolve(args[0]));
        });
    }
    async getLastValue() {
        if (this.currentTask) {
            await this.currentTask;
        }
        if (!this.lastValue) {
            throw new Error('Signal ended with no value');
        }
        return this.lastValue;
    }
    listen(cb) {
        if (!cb) {
            return new Promise((resolve) => {
                this.once((...args) => {
                    resolve(args[0]);
                });
            });
        }
        if (this.isEnded) {
            // wait for any outstanding, ended so can't re-trigger
            this.getLastValue().then((args) => cb(...args)).catch(() => { });
            return this;
        }
        this.listeners.push(cb);
        return this;
    }
    once(cb) {
        if (!cb) {
            return this.listen();
        }
        const wrappedListener = Object.assign((...args) => {
            this.unlisten(cb);
            return cb(...args);
        }, {
            listener: cb
        });
        return this.listen(wrappedListener);
    }
    countListeners() {
        return this.listeners.length;
    }
    /**
     * Remove a callback listener from this Signal.
     */
    unlisten(cb) {
        const index = this.listeners.findIndex((listener) => {
            return listener === cb || ('listener' in listener && listener.listener === cb);
        });
        this.listeners.splice(index, 1);
        return this;
    }
    async execTrigger(...args) {
        if (this.isEnded) {
            return;
        }
        this.triggerCountValue += 1;
        // capture listeners
        const tasks = this.listeners.slice();
        if (this.triggerType === TRIGGER_TYPE.ONCE) {
            // remove all listeners
            this.listeners = [];
            this.end(...args);
        }
        if (!tasks.length) {
            return;
        }
        // execute tasks in sequence
        await tasks.reduce(async (prev, task) => {
            await prev;
            await task(...args);
        }, Promise.resolve());
    }
    /**
     * Trigger the signal with optional value, like emitter.emit.
     */
    async trigger(...args) {
        const task = this.execTrigger(...args);
        this.currentTask = task;
        try {
            return await this.currentTask;
        }
        finally {
            if (this.currentTask === task) {
                this.currentTask = undefined;
            }
        }
    }
    async *[Symbol.asyncIterator]() {
        while (!this.isEnded) {
            yield await this.listen();
        }
    }
}
exports.Signal = Signal;
Signal.TRIGGER_TYPE = TRIGGER_TYPE;
/**
 * Special Signal for Errors.
 * Trigger this Signal to decide whether to suppress or throw err.
 * Suppress error if listeners don't rethrow
 * Throws on trigger if no listeners.
 * Won't trigger listeners for same Error instance more than once.
 */
class ErrorSignal extends Signal {
    constructor() {
        super(...arguments);
        this.seenErrors = new WeakSet();
        this.ignoredErrors = new WeakSet();
        this.minListeners = 1;
    }
    async execTrigger(...args) {
        if (this.isEnded) {
            return;
        }
        this.triggerCountValue += 1;
        // capture listeners
        const tasks = this.listeners.slice();
        if (this.triggerType === TRIGGER_TYPE.ONCE) {
            // remove all listeners
            this.listeners = [];
            this.end(...args);
        }
        if (!tasks.length) {
            return;
        }
        // execute tasks in sequence
        await tasks.reduce(async (prev, task) => {
            // pass previous error to next
            try {
                await prev;
            }
            catch (err) {
                // @ts-expect-error type mismatch in err parameter
                await task(err);
                return;
            }
            await task(...args);
        }, Promise.resolve());
    }
    async trigger(...args) {
        const err = args[0];
        // don't double-handle errors
        if (this.ignoredErrors.has(err)) {
            return;
        }
        if (this.seenErrors.has(err)) {
            // if we've seen this error, just throw
            throw err;
        }
        this.seenErrors.add(err);
        const hadMinListeners = !!(this.countListeners() >= this.minListeners);
        try {
            await super.trigger(...args);
            // rethrow if no listeners
            if (!hadMinListeners) {
                throw err;
            }
            // suppress error
            this.ignoredErrors.add(err);
        }
        catch (nextErr) {
            // don't double handle if different error thrown
            // by onError trigger
            this.seenErrors.add(nextErr);
            throw nextErr;
        }
    }
}
exports.ErrorSignal = ErrorSignal;
//# sourceMappingURL=Signal.js.map