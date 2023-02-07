import { MaybeAsync } from '../types';
export interface ICancelable {
    cancel(err?: Error): Promise<void>;
    isCancelled: () => boolean;
}
export type Cancelable<T extends object> = T & ICancelable;
export type MaybeCancelable<T extends object> = T | Cancelable<T>;
/**
 * Allows injecting a function to execute after an iterator finishes.
 * Executes finally function even if generator not started.
 * Returns new generator.
 */
type OnFinallyFn = MaybeAsync<(err?: Error) => void>;
export declare function iteratorFinally<T>(// eslint-disable-line no-redeclare
iterable: MaybeCancelable<AsyncIterable<T> | AsyncGenerator<T>>, onFinally?: OnFinallyFn): AsyncGenerator<T, any, unknown>;
/**
 * Creates a generator that can be cancelled and perform optional final cleanup.
 * const [cancal, generator] = CancelableGenerator(iterable, onFinally)
 */
export declare function CancelableGenerator<T>(iterable: MaybeCancelable<AsyncIterable<T> | AsyncGenerator<T>>, onFinally?: OnFinallyFn, { timeout }?: {
    timeout?: number | undefined;
}): Cancelable<AsyncGenerator<T, any, unknown>>;
export declare const nextValue: <T>(source: AsyncIterator<T, any, undefined>) => Promise<T | undefined>;
export declare const collect: <T>(source: AsyncIterable<T>, maxCount?: number) => Promise<T[]>;
export {};
