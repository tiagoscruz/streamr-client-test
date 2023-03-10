/**
 * An Error of Errors
 * Pass an array of errors + message to create
 * Single error without throwing away other errors
 * Specifically not using AggregateError name as this has slightly different API
 *
 * See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/AggregateError
 */
export declare class AggregatedError extends Error {
    errors: Set<Error>;
    ownMessage: string;
    ownStack?: string;
    constructor(errors?: Error[], errorMessage?: string);
    /**
     * Combine any errors from Promise.allSettled into AggregatedError.
     */
    static fromAllSettled(results?: never[], errorMessage?: string): AggregatedError | undefined;
    /**
     * Combine any errors from Promise.allSettled into AggregatedError and throw it.
     */
    static throwAllSettled(results?: never[], errorMessage?: string): void | never;
    /**
     * Handles 'upgrading' an existing error to an AggregatedError when necesary.
     */
    static from(oldErr?: Error | AggregatedError, newErr?: Error, msg?: string): Error | undefined;
    /**
     * Create a new error that adds err to list of errors
     */
    extend(err: Error, message?: string, baseClass?: Function): AggregatedError;
}
