import { MaybeAsync } from '../types';
/**
 * Execute functions in parallel, but ensure they resolve in the order they were executed
 */
export declare function pOrderedResolve<ArgsType extends unknown[], ReturnType>(fn: (...args: ArgsType) => ReturnType): ((...args: ArgsType) => Promise<any>) & {
    clear(): void;
};
/**
 * Returns a function that executes with limited concurrency.
 */
export declare function pLimitFn<ArgsType extends unknown[], ReturnType>(fn: (...args: ArgsType) => ReturnType | Promise<ReturnType>, limit?: number): ((...args: ArgsType) => Promise<ReturnType>) & {
    clear(): void;
};
/**
 * Only allows one outstanding call.
 * Returns same promise while task is executing.
 */
export declare function pOne<ArgsType extends unknown[], ReturnType>(fn: (...args: ArgsType) => ReturnType | Promise<ReturnType>): ((...args: ArgsType) => Promise<ReturnType>);
/**
 * Only allows calling `fn` once.
 * Returns same promise while task is executing.
 */
export declare function pOnce<ArgsType extends unknown[], ReturnType>(fn: (...args: ArgsType) => ReturnType | Promise<ReturnType>): ((...args: ArgsType) => Promise<ReturnType>) & {
    reset(): void;
    isStarted(): boolean;
};
export declare class TimeoutError extends Error {
    timeout: number;
    constructor(msg?: string, timeout?: number);
}
/**
 * Takes a promise and a timeout and an optional message for timeout errors.
 * Returns a promise that rejects when timeout expires, or when promise settles, whichever comes first.
 *
 * Invoke with positional arguments for timeout & message:
 * await pTimeout(promise, timeout, message)
 *
 * or using an options object for timeout, message & rejectOnTimeout:
 *
 * await pTimeout(promise, { timeout, message, rejectOnTimeout })
 *
 * message and rejectOnTimeout are optional.
 */
interface pTimeoutOpts {
    timeout?: number;
    message?: string;
    rejectOnTimeout?: boolean;
}
type pTimeoutArgs = [timeout?: number, message?: string] | [pTimeoutOpts];
export declare function pTimeout<T>(promise: Promise<T>, ...args: pTimeoutArgs): Promise<T | undefined>;
/**
 * Convert allSettled results into a thrown Aggregate error if necessary.
 */
export declare function allSettledValues(items: Parameters<(typeof Promise)['allSettled']>[0], errorMessage?: string): Promise<unknown[]>;
/**
 * Wait until a condition is true
 * @param condition - wait until this callback function returns true
 * @param timeOutMs - stop waiting after that many milliseconds, -1 for disable
 * @param pollingIntervalMs - check condition between so many milliseconds
 * @param failedMsgFn - append the string return value of this getter function to the error message, if given
 * @return the (last) truthy value returned by the condition function
 */
export declare function until(condition: MaybeAsync<() => boolean>, timeOutMs?: number, pollingIntervalMs?: number, failedMsgFn?: () => string): Promise<boolean>;
export declare const withThrottling: (fn: (...args: any[]) => Promise<any>, maxInvocationsPerSecond: number) => (...args: any[]) => Promise<any>;
export {};
