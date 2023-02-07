import { MaybeAsync } from '../types';
export type GeneratorForEach<InType> = MaybeAsync<(value: InType, index: number, src: AsyncGenerator<InType>) => void>;
export type GeneratorFilter<InType> = MaybeAsync<(value: InType, index: number, src: AsyncGenerator<InType>) => any>;
export type GeneratorMap<InType, OutType> = (value: InType, index: number, src: AsyncGenerator<InType>) => OutType | Promise<OutType>;
export type GeneratorReduce<InType, OutType> = (prevValue: OutType, value: InType, index: number, src: AsyncGenerator<InType>) => OutType | Promise<OutType>;
type OnError<ValueType> = (err: Error, value: ValueType, index: number) => Promise<any> | any;
/**
 * Similar to Array#forEach or Stream.PassThrough.
 * Allows inspection of a pipeline without mutating it.
 * Note: Pipeline will block until forEach call resolves.
 */
export declare function forEach<InType>(src: AsyncGenerator<InType>, fn: GeneratorForEach<InType>, onError?: OnError<InType>): AsyncGenerator<InType>;
/**
 * Similar to Array#map or Stream.Transform.
 */
export declare function map<InType, OutType>(src: AsyncGenerator<InType>, fn: GeneratorMap<InType, OutType>, onError?: OnError<InType>): AsyncGenerator<OutType>;
/**
 * Similar to Array#filter
 */
export declare function filter<InType>(src: AsyncGenerator<InType>, fn: GeneratorFilter<InType>, onError?: OnError<InType>): AsyncGenerator<InType>;
/**
 * Similar to Array#reduce, but more different than the other methods here.
 * This is perhaps more like an Array#map but it also passes the previous return value.
 * Still yields for each item, but passes previous return value to next iteration.
 * initialValue is passed as the previous value on first iteration.
 * Unlike Array#reduce, initialValue is required.
 */
export declare function reduce<InType, OutType>(src: AsyncGenerator<InType>, fn: GeneratorReduce<InType, OutType>, initialValue: OutType, onError?: OnError<InType>): AsyncGenerator<OutType>;
/**
 * Consume generator and collect results into an array.
 * Can take an optional number of items to consume.
 */
export declare function collect<InType>(src: AsyncGenerator<InType>, 
/** number of items to consume before ending, consumes all if undefined */
n?: number, onError?: OnError<InType>): Promise<InType[]>;
/**
 * Start consuming generator.
 * Takes optional forEach function.
 */
export declare function consume<InType>(src: AsyncGenerator<InType>, fn?: GeneratorForEach<InType>, onError?: OnError<InType>): Promise<void>;
export declare function unique<T>(source: AsyncIterable<T>, getIdentity: (item: T) => string): AsyncGenerator<T>;
export declare const fromArray: <T>(items: T[]) => AsyncGenerator<T, any, unknown>;
export declare const counting: <T>(items: AsyncIterable<T>, onFinally: (count: number) => void) => AsyncGenerator<T, any, unknown>;
export {};
