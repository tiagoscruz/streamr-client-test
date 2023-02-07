export type CacheAsyncFnType<ArgsType extends any[], ReturnType, KeyType = ArgsType[0]> = ((...args: ArgsType) => Promise<ReturnType>) & {
    clearMatching: (matchFn: (key: KeyType) => boolean) => void;
};
/**
 * Returns a cached async fn, cached keyed on first argument passed. See documentation for mem/p-memoize.
 * Caches into a LRU cache capped at options.maxSize
 * Won't call asyncFn again until options.maxAge or options.maxSize exceeded, or cachedAsyncFn.clear() is called.
 * Won't cache rejections by default. Override with options.cachePromiseRejection = true.
 *
 * ```js
 * const cachedAsyncFn = CacheAsyncFn(asyncFn, options)
 * await cachedAsyncFn(key)
 * await cachedAsyncFn(key)
 * cachedAsyncFn.clear()
 * ```
 */
export declare function CacheAsyncFn<ArgsType extends any[], ReturnType, KeyType = ArgsType[0]>(asyncFn: (...args: ArgsType) => PromiseLike<ReturnType>, { maxSize, maxAge, // 30 minutes
cachePromiseRejection, onEviction, cacheKey, // type+provide default so we can infer KeyType
...opts }?: {
    maxSize?: number;
    maxAge?: number;
    cachePromiseRejection?: boolean;
    onEviction?: (...args: any[]) => void;
    cacheKey?: (args: ArgsType) => KeyType;
}): CacheAsyncFnType<ArgsType, ReturnType, KeyType>;
/**
 * Returns a cached fn, cached keyed on first argument passed. See documentation for mem.
 * Caches into a LRU cache capped at options.maxSize
 * Won't call fn again until options.maxAge or options.maxSize exceeded, or cachedFn.clear() is called.
 *
 * ```js
 * const cachedFn = CacheFn(fn, options)
 * cachedFn(key)
 * cachedFn(key)
 * cachedFn(...args)
 * cachedFn.clear()
 * ```
 */
export declare function CacheFn<ArgsType extends any[], ReturnType, KeyType = ArgsType[0]>(fn: (...args: ArgsType) => ReturnType, { maxSize, maxAge, // 30 minutes
onEviction, cacheKey, // type+provide default so we can infer KeyType
...opts }?: {
    maxSize?: number;
    maxAge?: number;
    onEviction?: (...args: any[]) => void;
    cacheKey?: (args: ArgsType) => KeyType;
}): ((...args: ArgsType) => ReturnType) & {
    clearMatching: (matchFn: (key: KeyType) => boolean) => void;
};
