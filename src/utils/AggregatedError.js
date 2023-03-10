"use strict";
/**
 * An Error of Errors
 * Pass an array of errors + message to create
 * Single error without throwing away other errors
 * Specifically not using AggregateError name as this has slightly different API
 *
 * See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/AggregateError
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AggregatedError = void 0;
function joinMessages(msgs) {
    return msgs.filter(Boolean).join('\n');
}
function getStacks(err) {
    if (err instanceof AggregatedError) {
        return [
            err.ownStack,
            ...[...err.errors].map(({ stack }) => stack)
        ];
    }
    return [err.stack];
}
function joinStackTraces(errs) {
    return errs.flatMap((err) => getStacks(err)).filter(Boolean).join('\n');
}
class AggregatedError extends Error {
    constructor(errors = [], errorMessage = '') {
        const message = joinMessages([
            errorMessage,
            ...errors.map((err) => err.message)
        ]);
        super(message);
        errors.forEach((err) => {
            Object.assign(this, err);
        });
        this.message = message;
        this.ownMessage = errorMessage;
        this.errors = new Set(errors);
        this.ownStack = this.stack;
        this.stack = joinStackTraces([this, ...errors]);
    }
    /**
     * Combine any errors from Promise.allSettled into AggregatedError.
     */
    static fromAllSettled(results = [], errorMessage = '') {
        const errs = results.map(({ reason }) => reason).filter(Boolean);
        if (!errs.length) {
            return undefined;
        }
        return new this(errs, errorMessage);
    }
    /**
     * Combine any errors from Promise.allSettled into AggregatedError and throw it.
     */
    static throwAllSettled(results = [], errorMessage = '') {
        const err = this.fromAllSettled(results, errorMessage);
        if (err) {
            throw err;
        }
    }
    /**
     * Handles 'upgrading' an existing error to an AggregatedError when necesary.
     */
    static from(oldErr, newErr, msg) {
        if (!newErr) {
            if (oldErr && msg) {
                // copy message
                oldErr.message = joinMessages([oldErr.message, msg]);
            }
            return oldErr;
        }
        // When no oldErr, just return newErr
        if (!oldErr) {
            if (newErr && msg) {
                // copy message
                newErr.message = joinMessages([newErr.message, msg]);
            }
            return newErr;
        }
        // When oldErr is an AggregatedError, extend it
        if (oldErr instanceof AggregatedError) {
            return oldErr.extend(newErr, msg, this);
        }
        // Otherwise create new AggregatedError from oldErr and newErr
        return new this([oldErr]).extend(newErr, msg);
    }
    /**
     * Create a new error that adds err to list of errors
     */
    extend(err, message = '', baseClass = this.constructor) {
        if (err === this || this.errors.has(err)) {
            return this;
        }
        const errors = [err, ...this.errors];
        return new baseClass(errors, joinMessages([message, this.ownMessage]));
    }
}
exports.AggregatedError = AggregatedError;
//# sourceMappingURL=AggregatedError.js.map