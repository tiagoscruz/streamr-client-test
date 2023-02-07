"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Pipeline = void 0;
const utils_1 = require("./utils");
const promises_1 = require("./promises");
const iterators_1 = require("./iterators");
const G = __importStar(require("./GeneratorUtils"));
const Signal_1 = require("./Signal");
const StreamrClientError_1 = require("../StreamrClientError");
class PipelineDefinition {
    constructor(source, transforms = [], transformsBefore = []) {
        this.source = this.setSource(source);
        this.transforms = transforms;
        this.transformsBefore = transformsBefore;
    }
    /**
     * Append a transformation step to this pipeline.
     * Changes the pipeline's output type to output type of this generator.
     */
    pipe(fn) {
        this.transforms.push(fn);
        return this;
    }
    /**
     * Inject pipeline step before other transforms.
     * Note must return same type as source, otherwise we can't be type-safe.
     */
    pipeBefore(fn) {
        this.transformsBefore.push(fn);
        return this;
    }
    clearTransforms() {
        this.transforms = [];
        this.transformsBefore = [];
    }
    setSource(source) {
        const id = 'id' in source ? source.id : (0, utils_1.instanceId)(source, 'Source');
        this.source = Object.assign(source, {
            id,
        });
        return this.source;
    }
    getTransforms() {
        return [...this.transformsBefore, ...this.transforms];
    }
}
class Pipeline {
    constructor(source, definition) {
        this.isIterating = false;
        this.isCleaningUp = false;
        /**
         * Triggers once when pipeline ends.
         * Usage: `pipeline.onFinally(callback)`
         */
        this.onFinally = Signal_1.Signal.once();
        /**
         * Triggers once when pipeline is about to end.
         */
        this.onBeforeFinally = Signal_1.Signal.once();
        /**
         * Triggers once when pipeline starts flowing.
         * Usage: `pipeline.onStart(callback)`
         */
        this.onStart = Signal_1.Signal.once();
        this.onMessage = Signal_1.Signal.create();
        this.onError = Signal_1.ErrorSignal.create();
        this.source = source;
        this.definition = definition || new PipelineDefinition(source);
        this.cleanup = (0, promises_1.pOnce)(this.cleanup.bind(this));
        this.iterator = (0, iterators_1.iteratorFinally)(this.iterate(), this.cleanup);
        this.handleError = this.handleError.bind(this);
    }
    /**
     * Append a transformation step to this pipeline.
     * Changes the pipeline's output type to output type of this generator.
     */
    pipe(fn) {
        if (this.isIterating) {
            throw new StreamrClientError_1.StreamrClientError(`cannot pipe after already iterating: ${this.isIterating}`, 'PIPELINE_ERROR');
        }
        this.definition.pipe(fn);
        // this allows .pipe chaining to be type aware
        // i.e. new Pipeline(Type1).pipe(Type1 => Type2).pipe(Type2 => Type3)
        return this;
    }
    /**
     * Inject pipeline step before other transforms.
     * Note must return same type as source, otherwise we can't be type-safe.
     */
    pipeBefore(fn) {
        if (this.isIterating) {
            throw new StreamrClientError_1.StreamrClientError(`cannot pipe after already iterating: ${this.isIterating}`, 'PIPELINE_ERROR');
        }
        this.definition.pipeBefore(fn);
        return this;
    }
    /**
     * Fires this callback the moment this part of the pipeline starts returning.
     */
    onConsumed(fn) {
        return this.pipe(async function* onConsumed(src) {
            try {
                yield* src;
            }
            finally {
                await fn();
            }
        });
    }
    map(fn) {
        return this.pipe((src) => G.map(src, fn, this.onError.trigger));
    }
    mapBefore(fn) {
        return this.pipeBefore((src) => G.map(src, fn, this.onError.trigger));
    }
    forEach(fn) {
        return this.pipe((src) => G.forEach(src, fn, this.onError.trigger));
    }
    filter(fn) {
        return this.pipe((src) => G.filter(src, fn, this.onError.trigger));
    }
    reduce(fn, initialValue) {
        return this.pipe((src) => G.reduce(src, fn, initialValue, this.onError.trigger));
    }
    forEachBefore(fn) {
        return this.pipeBefore((src) => G.forEach(src, fn, this.onError.trigger));
    }
    filterBefore(fn) {
        return this.pipeBefore((src) => G.filter(src, fn, this.onError.trigger));
    }
    async consume(fn) {
        return G.consume(this, fn, this.handleError);
    }
    collect(n) {
        return G.collect(this, n, this.handleError);
    }
    flow() {
        setImmediate(() => {
            // consume if not already doing so
            if (!this.isIterating) {
                this.consume();
            }
        });
        return this;
    }
    async cleanup(error) {
        this.isCleaningUp = true;
        try {
            try {
                if (error) {
                    await this.onError.trigger(error);
                }
            }
            finally {
                await this.definition.source.return(undefined);
            }
        }
        finally {
            await this.onBeforeFinally.trigger();
            await this.onFinally.trigger(error);
            this.definition.clearTransforms();
        }
    }
    async handleError(err) {
        await this.onError.trigger(err);
    }
    async *iterate() {
        this.isIterating = true;
        await this.onStart.trigger();
        // this.debug('iterate', this.definition.source)
        if (!this.definition.source) {
            throw new StreamrClientError_1.StreamrClientError('no source', 'PIPELINE_ERROR');
        }
        const transforms = this.definition.getTransforms();
        // this.debug('transforms', transforms)
        // each pipeline step creates a generator
        // which is then passed into the next transform
        // end result is output of last transform's generator
        const pipeline = transforms.reduce((prev, transform) => {
            return transform(prev);
        }, this.definition.source);
        try {
            for await (const msg of pipeline) {
                await this.onMessage.trigger(msg);
                yield msg;
            }
            this.isCleaningUp = true;
        }
        catch (err) {
            this.isCleaningUp = true;
            await this.handleError(err);
        }
        finally {
            this.isCleaningUp = true;
            if (!this.onBeforeFinally.triggerCount) {
                await this.onBeforeFinally.trigger();
            }
        }
    }
    // AsyncGenerator implementation
    async throw(err) {
        if (this.isCleaningUp) {
            throw err;
        }
        if (!this.onBeforeFinally.triggerCount) {
            await this.onBeforeFinally.trigger();
        }
        // eslint-disable-next-line promise/no-promise-in-callback
        await this.definition.source.throw(err).catch(() => { });
        return this.iterator.throw(err);
    }
    async return(v) {
        if (this.isCleaningUp) {
            return Promise.resolve({ done: true, value: v });
        }
        if (!this.onBeforeFinally.triggerCount) {
            await this.onBeforeFinally.trigger();
        }
        await this.definition.source.return(undefined);
        return this.iterator.return(v);
    }
    async next() {
        return this.iterator.next();
    }
    /**
     * Create a new Pipeline forked from this pipeline.
     * Pushes results into fork.
     * Note: Does not start consuming this pipeline.
     */
    [Symbol.asyncIterator]() {
        if (this.isIterating) {
            throw new StreamrClientError_1.StreamrClientError('already iterating', 'PIPELINE_ERROR');
        }
        return this;
    }
}
exports.Pipeline = Pipeline;
//# sourceMappingURL=Pipeline.js.map