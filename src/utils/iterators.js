"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.collect = exports.nextValue = exports.CancelableGenerator = exports.iteratorFinally = void 0;
const events_1 = __importDefault(require("events"));
const p_memoize_1 = __importDefault(require("p-memoize"));
const AggregatedError_1 = require("./AggregatedError");
const promises_1 = require("./promises");
const utils_1 = require("@streamr/utils");
function iteratorFinally(// eslint-disable-line no-redeclare
iterable, onFinally) {
    if (!onFinally) {
        // noop if no onFinally
        return (async function* Noop() {
            yield* iterable;
        }());
    }
    let started = false;
    let ended = false;
    let error;
    let onFinallyTask;
    // ensure finally only runs once
    let onFinallyOnce = (err) => {
        if (!onFinallyTask) {
            // eslint-disable-next-line promise/no-promise-in-callback
            onFinallyTask = Promise.resolve(onFinally(err)).finally(() => {
                onFinallyOnce = () => { };
            });
        }
        return onFinallyTask;
    };
    // wraps return/throw to call onFinally even if generator was never started
    function handleFinally(originalFn) {
        return async (...args) => {
            // * only await onFinally if not started
            // * call original return/throw *immediately* in either case
            // Otherwise:
            // * if started, iterator won't stop until onFinally finishes
            // * if not started, iterator can still be started before onFinally finishes
            // This function handles both cases, but note here as a reminder.
            ended = true;
            if (started) {
                return originalFn(...args);
            }
            // otherwise iteration can still start if finally function still pending
            try {
                return await originalFn(...args);
            }
            catch (err) {
                if (!error) {
                    error = err;
                }
                throw err;
            }
            finally {
                await onFinallyOnce(error);
            }
        };
    }
    // wrap in generator to track if generator was started
    const gen = (async function* TrackStarted() {
        started = true;
        try {
            yield* iterable;
        }
        catch (err) {
            if (!error) {
                error = err;
            }
            throw err;
        }
        finally {
            await onFinallyOnce(error);
        }
    }());
    const it = gen[Symbol.asyncIterator].bind(gen);
    let g;
    // copy cancel api across if exists
    if ('cancel' in iterable) {
        g = Object.assign(gen, {
            cancel: (err) => iterable.cancel(err),
            isCancelled: () => iterable.isCancelled()
        });
    }
    else {
        g = gen;
    }
    // replace generator methods
    return Object.assign(g, {
        return: handleFinally(g.return.bind(g)),
        throw: handleFinally(g.throw.bind(g)),
        [Symbol.asyncIterator]() {
            // if ended before started
            if (ended && !started) {
                // return a generator that simply runs finally script (once)
                return (async function* generatorRunFinally() {
                    try {
                        // NOTE: native generators do not throw if gen.throw(err) called before started
                        // so we should do the same here
                        if ('return' in iterable) {
                            await iterable.return(undefined); // runs onFinally for nested iterable
                        }
                    }
                    finally {
                        await onFinallyOnce();
                    }
                }());
            }
            return it();
        }
    });
}
exports.iteratorFinally = iteratorFinally;
async function endGenerator(gtr, error) {
    return error
        ? gtr.throw(error).catch(() => { }) // ignore err
        : gtr.return(undefined);
}
function canCancel(gtr) {
    return (gtr
        && 'cancel' in gtr && typeof gtr.cancel === 'function'
        && typeof gtr.isCancelled === 'function'
        && !gtr.isCancelled());
}
async function cancelGenerator(gtr, error) {
    if (!canCancel(gtr)) {
        return;
    }
    await gtr.cancel(error);
}
const endGeneratorTimeout = (0, p_memoize_1.default)(async (gtr, error, timeout = 250) => {
    await (0, promises_1.pTimeout)(endGenerator(gtr, error), {
        timeout,
        rejectOnTimeout: false,
    });
    if (canCancel(gtr)) {
        await cancelGenerator(gtr, error);
    }
}, {
    cache: new WeakMap(),
    cachePromiseRejection: true,
});
/**
 * Creates a generator that can be cancelled and perform optional final cleanup.
 * const [cancal, generator] = CancelableGenerator(iterable, onFinally)
 */
function CancelableGenerator(iterable, onFinally = () => { }, { timeout = 250 } = {}) {
    let cancelled = false;
    let finalCalled = false;
    let error;
    const cancelSignal = new events_1.default();
    const onDone = new utils_1.Defer();
    let iterator;
    async function cancelIterable(err) {
        // cancel inner if has cancel
        await cancelGenerator(iterable, err);
        await cancelGenerator(iterator, err);
    }
    function collectErrors(value) {
        if (!value || value === error) {
            return;
        }
        if (!error) {
            error = value;
            return;
        }
        error = 'extend' in error
            ? error.extend(value, value.message)
            : new AggregatedError_1.AggregatedError([value, error], value.message);
    }
    function resolveCancel(value) {
        if (value instanceof Error) {
            collectErrors(value);
        }
        if (error) {
            cancelSignal.emit('cancel', error);
        }
        else {
            cancelSignal.emit('cancel', value);
        }
    }
    const cancel = (gtr) => async (value) => {
        if (cancelled || finalCalled) {
            // prevent recursion
            return onDone;
        }
        cancelled = true;
        resolveCancel(value);
        // need to make sure we don't try return inside final otherwise we end up deadlocked
        await endGeneratorTimeout(gtr, error, timeout);
        return onDone;
    };
    let pendingNext = 0;
    async function* CancelableGeneratorFn() {
        // manually iterate
        iterator = iterable[Symbol.asyncIterator]();
        try {
            yield* {
                // each next() races against cancel signal
                next: async () => {
                    pendingNext += 1;
                    cancelSignal.setMaxListeners(pendingNext);
                    // NOTE:
                    // Very easy to create a memleak here.
                    // Using a shared promise with Promise.race
                    // between loop iterations prevents data from being GC'ed.
                    // Create new per-loop promise and resolve using an event emitter.
                    const cancelPromise = new utils_1.Defer();
                    const onCancel = (v) => {
                        if (v instanceof Error) {
                            cancelPromise.reject(v);
                        }
                        else {
                            cancelPromise.resolve({ value: undefined, done: true });
                        }
                    };
                    cancelSignal.once('cancel', onCancel);
                    return Promise.race([
                        iterator.next(),
                        cancelPromise,
                    ]).finally(() => {
                        pendingNext -= 1;
                        cancelSignal.setMaxListeners(pendingNext);
                        cancelSignal.off('cancel', onCancel);
                    });
                },
                async throw(err) {
                    cancelSignal.removeAllListeners();
                    await endGeneratorTimeout(iterator, err, timeout);
                    throw err;
                },
                async return(v) {
                    cancelSignal.removeAllListeners();
                    await endGeneratorTimeout(iterator, error, timeout);
                    return {
                        value: v,
                        done: true,
                    };
                },
                [Symbol.asyncIterator]() {
                    return this;
                },
            };
        }
        finally {
            cancelSignal.removeAllListeners();
            // try end iterator
            if (iterator) {
                await endGeneratorTimeout(iterator, error, timeout);
            }
        }
    }
    const c = CancelableGeneratorFn();
    const cancelableGenerator = iteratorFinally(c, async (err) => {
        finalCalled = true;
        try {
            // cancel inner if has cancel
            await cancelIterable(err || error);
            await onFinally(err || error);
        }
        finally {
            onDone.resolve(undefined);
        }
        // error whole generator, for await of will reject.
        if (error) {
            throw error;
        }
        return onDone;
    });
    const cancelFn = cancel(cancelableGenerator);
    Object.assign(cancelableGenerator, {
        cancel: cancelFn,
        timeout,
        isCancelled: () => cancelled,
        isDone: () => finalCalled,
    });
    return cancelableGenerator;
}
exports.CancelableGenerator = CancelableGenerator;
const nextValue = async (source) => {
    const item = source.next();
    return (await item).value;
};
exports.nextValue = nextValue;
const collect = async (source, maxCount) => {
    const items = [];
    for await (const item of source) {
        items.push(item);
        if ((maxCount !== undefined) && (items.length >= maxCount)) {
            break;
        }
    }
    return items;
};
exports.collect = collect;
//# sourceMappingURL=iterators.js.map