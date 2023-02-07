"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.withThrottling = exports.until = exports.allSettledValues = exports.pTimeout = exports.TimeoutError = exports.pOnce = exports.pOne = exports.pLimitFn = exports.pOrderedResolve = void 0;
const p_limit_1 = __importDefault(require("p-limit"));
const p_throttle_1 = __importDefault(require("p-throttle"));
const utils_1 = require("@streamr/utils");
const AggregatedError_1 = require("./AggregatedError");
/**
 * Execute functions in parallel, but ensure they resolve in the order they were executed
 */
function pOrderedResolve(fn) {
    const queue = (0, p_limit_1.default)(1);
    return Object.assign(async (...args) => {
        const d = new utils_1.Defer();
        const done = queue(() => d);
        await Promise.resolve(fn(...args)).then(d.resolve.bind(d), d.reject.bind(d));
        return done;
    }, {
        clear() {
            queue.clearQueue();
        }
    });
}
exports.pOrderedResolve = pOrderedResolve;
/**
 * Returns a function that executes with limited concurrency.
 */
function pLimitFn(fn, limit = 1) {
    const queue = (0, p_limit_1.default)(limit);
    return Object.assign((...args) => queue(() => fn(...args)), {
        clear() {
            queue.clearQueue();
        }
    });
}
exports.pLimitFn = pLimitFn;
/**
 * Only allows one outstanding call.
 * Returns same promise while task is executing.
 */
function pOne(fn) {
    const once = pOnce(fn);
    return async (...args) => {
        try {
            return await once(...args);
        }
        finally {
            once.reset();
        }
    };
}
exports.pOne = pOne;
/**
 * Only allows calling `fn` once.
 * Returns same promise while task is executing.
 */
function pOnce(fn) {
    let currentCall = { status: 'init' };
    return Object.assign(async function pOnceWrap(...args) {
        // capture currentCall so can assign to it, even after reset
        const thisCall = currentCall;
        if (thisCall.status === 'pending') {
            return thisCall.promise;
        }
        if (thisCall.status === 'fulfilled') {
            return thisCall.value;
        }
        if (thisCall.status === 'rejected') {
            throw thisCall.reason;
        }
        // status === 'init'
        currentCall = thisCall;
        const promise = (async () => {
            // capture value/error
            try {
                const value = await fn(...args);
                Object.assign(thisCall, {
                    promise: undefined,
                    status: 'fulfilled',
                    value,
                });
                return value;
            }
            catch (reason) {
                Object.assign(thisCall, {
                    promise: undefined,
                    status: 'rejected',
                    reason,
                });
                throw reason;
            }
        })();
        promise.catch(() => { }); // prevent unhandled
        Object.assign(thisCall, {
            status: 'pending',
            promise,
        });
        return promise;
    }, {
        isStarted() {
            return currentCall.status !== 'init';
        },
        reset() {
            currentCall = { status: 'init' };
        }
    });
}
exports.pOnce = pOnce;
class TimeoutError extends Error {
    constructor(msg = '', timeout = 0) {
        super(`The operation timed out. ${timeout}ms. ${msg}`);
        this.timeout = timeout;
    }
}
exports.TimeoutError = TimeoutError;
async function pTimeout(promise, ...args) {
    let opts = {};
    if (args[0] && typeof args[0] === 'object') {
        [opts] = args;
    }
    else {
        [opts.timeout, opts.message] = args;
    }
    const { timeout = 0, message = '', rejectOnTimeout = true } = opts;
    if (typeof timeout !== 'number') {
        throw new Error(`timeout must be a number, got ${timeout}`);
    }
    let timedOut = false;
    const p = new utils_1.Defer();
    const t = setTimeout(() => {
        timedOut = true;
        if (rejectOnTimeout) {
            p.reject(new TimeoutError(message, timeout));
        }
        else {
            p.resolve(undefined);
        }
    }, timeout);
    p.catch(() => { });
    return Promise.race([
        Promise.resolve(promise).catch((err) => {
            clearTimeout(t);
            if (timedOut) {
                // ignore errors after timeout
                return undefined;
            }
            throw err;
        }),
        p
    ]).finally(() => {
        clearTimeout(t);
        p.resolve(undefined);
    });
}
exports.pTimeout = pTimeout;
/**
 * Convert allSettled results into a thrown Aggregate error if necessary.
 */
async function allSettledValues(items, errorMessage = '') {
    const result = await Promise.allSettled(items);
    const errs = result
        .filter(({ status }) => status === 'rejected')
        .map((v) => v.reason);
    if (errs.length) {
        throw new AggregatedError_1.AggregatedError(errs, errorMessage);
    }
    return result
        .map((v) => v.value);
}
exports.allSettledValues = allSettledValues;
// TODO use streamr-test-utils#waitForCondition instead (when streamr-test-utils is no longer a test-only dependency)
/**
 * Wait until a condition is true
 * @param condition - wait until this callback function returns true
 * @param timeOutMs - stop waiting after that many milliseconds, -1 for disable
 * @param pollingIntervalMs - check condition between so many milliseconds
 * @param failedMsgFn - append the string return value of this getter function to the error message, if given
 * @return the (last) truthy value returned by the condition function
 */
async function until(condition, timeOutMs = 10000, pollingIntervalMs = 100, failedMsgFn) {
    // condition could as well return any instead of boolean, could be convenient
    // sometimes if waiting until a value is returned. Maybe change if such use
    // case emerges.
    const err = new Error(`Timeout after ${timeOutMs} milliseconds`);
    let isTimedOut = false;
    let t;
    if (timeOutMs > 0) {
        t = setTimeout(() => { isTimedOut = true; }, timeOutMs);
    }
    try {
        // Promise wrapped condition function works for normal functions just the same as Promises
        let wasDone = false;
        while (!wasDone && !isTimedOut) { // eslint-disable-line no-await-in-loop
            wasDone = await Promise.resolve().then(condition); // eslint-disable-line no-await-in-loop
            if (!wasDone && !isTimedOut) {
                await (0, utils_1.wait)(pollingIntervalMs); // eslint-disable-line no-await-in-loop
            }
        }
        if (isTimedOut) {
            if (failedMsgFn) {
                err.message += ` ${failedMsgFn()}`;
            }
            throw err;
        }
        return wasDone;
    }
    finally {
        clearTimeout(t);
    }
}
exports.until = until;
// TODO better type annotations
const withThrottling = (fn, maxInvocationsPerSecond) => {
    const throttler = (0, p_throttle_1.default)({
        limit: maxInvocationsPerSecond,
        interval: 1000
    });
    return throttler(fn);
};
exports.withThrottling = withThrottling;
//# sourceMappingURL=promises.js.map