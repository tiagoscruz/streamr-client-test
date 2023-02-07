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
exports.pull = exports.PushBuffer = exports.DEFAULT_BUFFER_SIZE = void 0;
const Gate_1 = require("./Gate");
const G = __importStar(require("./GeneratorUtils"));
const StreamrClientError_1 = require("../StreamrClientError");
exports.DEFAULT_BUFFER_SIZE = 256;
function isError(err) {
    if (!err) {
        return false;
    }
    if (err instanceof Error) {
        return true;
    }
    return !!(err
        && err.stack
        && err.message
        && typeof err.stack === 'string'
        && typeof err.message === 'string');
}
/**
 * Implements an async buffer.
 * Push items into buffer, push will async block once buffer is full.
 * and will unblock once buffer has been consumed.
 */
class PushBuffer {
    constructor(bufferSize = exports.DEFAULT_BUFFER_SIZE) {
        this.buffer = [];
        this.isIterating = false;
        if (!(bufferSize > 0 && Number.isSafeInteger(bufferSize))) {
            throw new StreamrClientError_1.StreamrClientError(`bufferSize must be a safe positive integer, got: ${bufferSize}`, 'INVALID_ARGUMENT');
        }
        this.bufferSize = bufferSize;
        // start both closed
        this.writeGate = new Gate_1.Gate();
        this.readGate = new Gate_1.Gate();
        this.writeGate.close();
        this.readGate.close();
        this.iterator = this.iterate();
        // this.debug('create', this.bufferSize)
    }
    /**
     * Puts item in buffer and opens readGate.
     * Blocks until writeGate is open again (or locked)
     * @returns Promise<true> if item was pushed, Promise<false> if done or became done before writeGate opened.
     */
    async push(item) {
        if (!this.isWritable()) {
            return false;
        }
        this.buffer.push(item);
        this.updateWriteGate();
        this.readGate.open();
        return this.writeGate.check();
    }
    map(fn) {
        const p = new PushBuffer(this.bufferSize);
        pull(G.map(this, fn), p);
        return p;
    }
    forEach(fn) {
        const p = new PushBuffer(this.bufferSize);
        pull(G.forEach(this, fn), p);
        return p;
    }
    filter(fn) {
        const p = new PushBuffer(this.bufferSize);
        pull(G.filter(this, fn), p);
        return p;
    }
    reduce(fn, initialValue) {
        const p = new PushBuffer(this.bufferSize);
        pull(G.reduce(this, fn, initialValue), p);
        return p;
    }
    /**
     * Collect n/all messages into an array.
     */
    async collect(n) {
        if (this.isIterating) {
            // @ts-expect-error ts can't do this.constructor properly
            throw new this.constructor.Error(this, 'Cannot collect if already iterating.');
        }
        return G.collect(this, n);
    }
    updateWriteGate() {
        this.writeGate.setOpenState(!this.isFull());
    }
    /**
     * Immediate end of reading and writing
     * Buffer will not flush.
     */
    end(err) {
        if (err) {
            this.error = err;
        }
        this.lock();
    }
    /**
     * Prevent further reads or writes.
     */
    lock() {
        this.writeGate.lock();
        this.readGate.lock();
    }
    /**
     * Prevent further writes.
     * Allows buffer to flush before ending.
     */
    endWrite(err) {
        if (err && !this.error) {
            this.error = err;
        }
        this.readGate.open();
        this.writeGate.lock();
    }
    /**
     * True if buffered at least bufferSize items.
     * After this point, push will block until buffer is emptied again.
     */
    isFull() {
        return this.buffer.length >= this.bufferSize;
    }
    /**
     * True if buffer has closed reads and writes.
     */
    isDone() {
        return this.writeGate.isLocked && this.readGate.isLocked;
    }
    /**
     * Can't write if write gate locked.
     * No point writing if read gate is locked.
     */
    isWritable() {
        return !this.writeGate.isLocked && !this.readGate.isLocked;
    }
    async *iterate() {
        this.isIterating = true;
        try {
            // if there's something buffered, we want to flush it
            while (!this.readGate.isLocked) {
                // keep reading off front of buffer until buffer empty
                while (this.buffer.length && !this.readGate.isLocked) {
                    const v = this.buffer.shift();
                    // maybe open write gate
                    this.updateWriteGate();
                    if (isError(v)) {
                        throw v;
                    }
                    yield v;
                }
                if (this.buffer.length === 0 && this.writeGate.isLocked) {
                    break;
                }
                if (this.isDone()) {
                    // buffer is empty and we're done
                    break;
                }
                // buffer must be empty, close readGate until more writes.
                this.readGate.close();
                // wait for something to be written
                const ok = await this.readGate.check();
                if (!ok) {
                    // no more reading
                    break;
                }
            }
            const { error } = this;
            if (error) {
                this.error = undefined;
                throw error;
            }
        }
        finally {
            this.buffer = [];
            this.lock();
        }
    }
    get length() {
        return this.buffer.length;
    }
    // clears any pending items in buffer
    clear() {
        this.buffer = [];
    }
    // AsyncGenerator implementation
    async throw(err) {
        this.endWrite(err);
        return this.iterator.throw(err);
    }
    async return(v) {
        this.end();
        return this.iterator.return(v);
    }
    next() {
        return this.iterator.next();
    }
    async pull(src) {
        try {
            for await (const v of src) {
                const ok = await this.push(v);
                if (!ok || !this.isWritable()) {
                    break;
                }
            }
        }
        catch (err) {
            // this.endWrite(err)
        }
        this.endWrite();
    }
    [Symbol.asyncIterator]() {
        if (this.isIterating) {
            // @ts-expect-error ts can't do this.constructor properly
            throw new this.constructor.Error(this, 'already iterating');
        }
        return this;
    }
}
exports.PushBuffer = PushBuffer;
/**
 * Pull from a source into some PushBuffer
 */
async function pull(src, dest) {
    if (!src) {
        throw new Error('no source');
    }
    try {
        for await (const v of src) {
            const ok = await dest.push(v);
            if (!ok) {
                break;
            }
        }
    }
    catch (err) {
        dest.endWrite(err);
    }
    finally {
        dest.endWrite();
    }
}
exports.pull = pull;
//# sourceMappingURL=PushBuffer.js.map