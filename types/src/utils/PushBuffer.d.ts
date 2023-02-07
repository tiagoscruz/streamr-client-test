import { Gate } from './Gate';
import * as G from './GeneratorUtils';
export declare const DEFAULT_BUFFER_SIZE = 256;
export type IPushBuffer<InType, OutType = InType> = {
    push(item: InType): Promise<boolean>;
    end(error?: Error): void;
    endWrite(error?: Error): void;
    length: number;
    isDone(): boolean;
    clear(): void;
    collect(n?: number): Promise<OutType[]>;
} & AsyncGenerator<OutType>;
/**
 * Implements an async buffer.
 * Push items into buffer, push will async block once buffer is full.
 * and will unblock once buffer has been consumed.
 */
export declare class PushBuffer<T> implements IPushBuffer<T> {
    protected buffer: (T | Error)[];
    readonly bufferSize: number;
    /** open when writable */
    protected readonly writeGate: Gate;
    /** open when readable */
    protected readonly readGate: Gate;
    protected error: Error | undefined;
    protected iterator: AsyncGenerator<T>;
    protected isIterating: boolean;
    constructor(bufferSize?: number);
    /**
     * Puts item in buffer and opens readGate.
     * Blocks until writeGate is open again (or locked)
     * @returns Promise<true> if item was pushed, Promise<false> if done or became done before writeGate opened.
     */
    push(item: T | Error): Promise<boolean>;
    map<NewOutType>(fn: G.GeneratorMap<T, NewOutType>): PushBuffer<NewOutType>;
    forEach(fn: G.GeneratorForEach<T>): PushBuffer<unknown>;
    filter(fn: G.GeneratorFilter<T>): PushBuffer<unknown>;
    reduce<NewOutType>(fn: G.GeneratorReduce<T, NewOutType>, initialValue: NewOutType): PushBuffer<unknown>;
    /**
     * Collect n/all messages into an array.
     */
    collect(n?: number): Promise<T[]>;
    private updateWriteGate;
    /**
     * Immediate end of reading and writing
     * Buffer will not flush.
     */
    end(err?: Error): void;
    /**
     * Prevent further reads or writes.
     */
    lock(): void;
    /**
     * Prevent further writes.
     * Allows buffer to flush before ending.
     */
    endWrite(err?: Error): void;
    /**
     * True if buffered at least bufferSize items.
     * After this point, push will block until buffer is emptied again.
     */
    private isFull;
    /**
     * True if buffer has closed reads and writes.
     */
    isDone(): boolean;
    /**
     * Can't write if write gate locked.
     * No point writing if read gate is locked.
     */
    isWritable(): boolean;
    private iterate;
    get length(): number;
    clear(): void;
    throw(err: Error): Promise<IteratorResult<T, any>>;
    return(v?: T): Promise<IteratorResult<T, any>>;
    next(): Promise<IteratorResult<T, any>>;
    pull(src: AsyncGenerator<T>): Promise<void>;
    [Symbol.asyncIterator](): this;
}
/**
 * Pull from a source into some PushBuffer
 */
export declare function pull<InType, OutType = InType>(src: AsyncGenerator<InType>, dest: IPushBuffer<InType, OutType>): Promise<void>;
