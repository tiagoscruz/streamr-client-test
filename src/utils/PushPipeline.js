"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PushPipeline = void 0;
const PushBuffer_1 = require("./PushBuffer");
const Pipeline_1 = require("./Pipeline");
/**
 * Pipeline that is also a PushBuffer.
 * i.e. can call .push to push data into pipeline and .pipe to transform it.
 */
class PushPipeline extends Pipeline_1.Pipeline {
    constructor(bufferSize = PushBuffer_1.DEFAULT_BUFFER_SIZE) {
        const inputBuffer = new PushBuffer_1.PushBuffer(bufferSize);
        super(inputBuffer);
        this.source = inputBuffer;
    }
    pipe(fn) {
        // this method override just fixes the output type to be PushPipeline rather than Pipeline
        super.pipe(fn);
        return this;
    }
    map(fn) {
        // this method override just fixes the output type to be PushPipeline rather than Pipeline
        return super.map(fn);
    }
    mapBefore(fn) {
        // this method override just fixes the output type to be PushPipeline rather than Pipeline
        return super.mapBefore(fn);
    }
    filterBefore(fn) {
        // this method override just fixes the output type to be PushPipeline rather than Pipeline
        return super.filterBefore(fn);
    }
    filter(fn) {
        // this method override just fixes the output type to be PushPipeline rather than Pipeline
        return super.filter(fn);
    }
    forEach(fn) {
        // this method override just fixes the output type to be PushPipeline rather than Pipeline
        return super.forEach(fn);
    }
    forEachBefore(fn) {
        // this method override just fixes the output type to be PushPipeline rather than Pipeline
        return super.forEachBefore(fn);
    }
    pull(source) {
        return (0, PushBuffer_1.pull)(source, this);
    }
    // wrapped PushBuffer methods below here
    async push(item) {
        return this.source.push(item);
    }
    async handleError(err) {
        try {
            await this.onError.trigger(err);
        }
        catch (error) {
            if (this.isCleaningUp) {
                throw error;
            }
            await this.push(error);
        }
    }
    end(err) {
        return this.source.end(err);
    }
    endWrite(err) {
        return this.source.endWrite(err);
    }
    isDone() {
        return this.source.isDone();
    }
    get length() {
        return this.source.length || 0;
    }
    clear() {
        return this.source.clear();
    }
}
exports.PushPipeline = PushPipeline;
//# sourceMappingURL=PushPipeline.js.map