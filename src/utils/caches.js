"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheFn = exports.CacheAsyncFn = void 0;
const p_memoize_1 = __importDefault(require("p-memoize"));
const mem_1 = __importDefault(require("mem"));
const quick_lru_1 = __importDefault(require("../../vendor/quick-lru"));
function clearMatching(cache, matchFn) {
    for (const key of cache.keys()) {
        if (matchFn(key)) {
            cache.delete(key);
        }
    }
}
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
function CacheAsyncFn(asyncFn, { maxSize = 10000, maxAge = 30 * 60 * 1000, // 30 minutes
cachePromiseRejection = false, onEviction = () => { }, cacheKey = (args) => args[0], // type+provide default so we can infer KeyType
...opts } = {}) {
    const cache = new quick_lru_1.default({
        maxSize,
        maxAge,
        onEviction,
    });
    const cachedFn = Object.assign((0, p_memoize_1.default)(asyncFn, {
        cachePromiseRejection,
        cache,
        cacheKey,
        ...opts,
    }), {
        clearMatching: (matchFn) => clearMatching(cache, matchFn),
    });
    return cachedFn;
}
exports.CacheAsyncFn = CacheAsyncFn;
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
function CacheFn(fn, { maxSize = 10000, maxAge = 30 * 60 * 1000, // 30 minutes
onEviction = () => { }, cacheKey = (args) => args[0], // type+provide default so we can infer KeyType
...opts } = {}) {
    const cache = new quick_lru_1.default({
        maxSize,
        maxAge,
        onEviction,
    });
    const cachedFn = Object.assign((0, mem_1.default)(fn, {
        cache,
        cacheKey,
        ...opts,
    }), {
        clearMatching: (matchFn) => clearMatching(cache, matchFn),
    });
    return cachedFn;
}
exports.CacheFn = CacheFn;
//# sourceMappingURL=caches.js.map