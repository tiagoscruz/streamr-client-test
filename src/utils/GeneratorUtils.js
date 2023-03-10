"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.counting = exports.fromArray = exports.unique = exports.consume = exports.collect = exports.reduce = exports.filter = exports.map = exports.forEach = void 0;
const noopConsume = async (src) => {
    // eslint-disable-next-line no-underscore-dangle
    for await (const _msg of src) {
        // noop, just consume
    }
};
/**
 * Similar to Array#forEach or Stream.PassThrough.
 * Allows inspection of a pipeline without mutating it.
 * Note: Pipeline will block until forEach call resolves.
 */
async function* forEach(src, fn, onError) {
    let index = 0;
    for await (const v of src) {
        try {
            await fn(v, index, src);
        }
        catch (err) {
            if (onError) {
                await onError(err, v, index);
                continue;
            }
            else {
                throw err;
            }
        }
        finally {
            index += 1;
        }
        yield v;
    }
}
exports.forEach = forEach;
/**
 * Similar to Array#map or Stream.Transform.
 */
async function* map(src, fn, onError) {
    let index = 0;
    for await (const v of src) {
        try {
            yield await fn(v, index, src);
        }
        catch (err) {
            if (onError) {
                await onError(err, v, index);
                continue;
            }
            else {
                throw err;
            }
        }
        finally {
            index += 1;
        }
    }
}
exports.map = map;
/**
 * Similar to Array#filter
 */
async function* filter(src, fn, onError) {
    let index = 0;
    for await (const v of src) {
        let ok;
        try {
            ok = await fn(v, index, src);
        }
        catch (err) {
            if (onError) {
                await onError(err, v, index);
                continue;
            }
            else {
                throw err;
            }
        }
        finally {
            index += 1;
        }
        if (ok) {
            yield v;
        }
    }
}
exports.filter = filter;
/**
 * Similar to Array#reduce, but more different than the other methods here.
 * This is perhaps more like an Array#map but it also passes the previous return value.
 * Still yields for each item, but passes previous return value to next iteration.
 * initialValue is passed as the previous value on first iteration.
 * Unlike Array#reduce, initialValue is required.
 */
async function* reduce(src, fn, initialValue, onError) {
    let result = initialValue;
    yield* map(src, async (value, index, srcGen) => {
        result = await fn(result, value, index, srcGen); // eslint-disable-line require-atomic-updates
        return result;
    }, onError);
}
exports.reduce = reduce;
// TODO many use cases could use collect() utility method
// for AsyncIterables instead (iterators.ts)
/**
 * Consume generator and collect results into an array.
 * Can take an optional number of items to consume.
 */
async function collect(src, 
/** number of items to consume before ending, consumes all if undefined */
n, onError) {
    const results = [];
    await consume(src, async (value, index, srcGen) => {
        results.push(value);
        if (n != null && index === n - 1) {
            await srcGen.return(undefined);
        }
    }, onError);
    return results;
}
exports.collect = collect;
/**
 * Start consuming generator.
 * Takes optional forEach function.
 */
async function consume(src, fn = (v) => v, onError) {
    return noopConsume(forEach(src, fn, onError));
}
exports.consume = consume;
async function* unique(source, getIdentity) {
    const seenIdentities = new Set();
    for await (const item of source) {
        const identity = getIdentity(item);
        if (!seenIdentities.has(identity)) {
            seenIdentities.add(identity);
            yield item;
        }
    }
}
exports.unique = unique;
const fromArray = async function* (items) {
    for (const item of items) {
        yield item;
    }
};
exports.fromArray = fromArray;
const counting = async function* (items, onFinally) {
    let count = 0;
    try {
        for await (const item of items) {
            yield item;
            count++;
        }
    }
    finally {
        onFinally(count);
    }
};
exports.counting = counting;
//# sourceMappingURL=GeneratorUtils.js.map