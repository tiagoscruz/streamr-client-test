import * as G from './GeneratorUtils';
import { Signal } from './Signal';
export type PipelineTransform<InType = any, OutType = any> = (src: AsyncGenerator<InType>) => AsyncGenerator<OutType>;
type AsyncGeneratorWithId<T> = AsyncGenerator<T> & {
    id: string;
};
/**
 * Pipeline public interface
 */
export type IPipeline<InType, OutType = InType> = {
    pipe<NewOutType>(fn: PipelineTransform<OutType, NewOutType>): IPipeline<InType, NewOutType>;
    map<NewOutType>(fn: G.GeneratorMap<OutType, NewOutType>): IPipeline<InType, NewOutType>;
    mapBefore(fn: G.GeneratorMap<InType, InType>): IPipeline<InType, OutType>;
    filter(fn: G.GeneratorFilter<OutType>): IPipeline<InType, OutType>;
    forEach(fn: G.GeneratorForEach<OutType>): IPipeline<InType, OutType>;
    forEachBefore(fn: G.GeneratorForEach<InType>): IPipeline<InType, OutType>;
    filterBefore(fn: G.GeneratorForEach<InType>): IPipeline<InType, OutType>;
    collect(n?: number): Promise<OutType[]>;
    consume(): Promise<void>;
    pipeBefore(fn: PipelineTransform<InType, InType>): IPipeline<InType, OutType>;
} & AsyncGenerator<OutType>;
declare class PipelineDefinition<InType, OutType = InType> {
    source: AsyncGeneratorWithId<InType>;
    protected transforms: PipelineTransform[];
    protected transformsBefore: PipelineTransform[];
    constructor(source: AsyncGenerator<InType>, transforms?: PipelineTransform[], transformsBefore?: PipelineTransform[]);
    /**
     * Append a transformation step to this pipeline.
     * Changes the pipeline's output type to output type of this generator.
     */
    pipe<NewOutType>(fn: PipelineTransform<OutType, NewOutType>): PipelineDefinition<InType, NewOutType>;
    /**
     * Inject pipeline step before other transforms.
     * Note must return same type as source, otherwise we can't be type-safe.
     */
    pipeBefore(fn: PipelineTransform<InType, InType>): PipelineDefinition<InType, OutType>;
    clearTransforms(): void;
    setSource(source: AsyncGenerator<InType> | AsyncGeneratorWithId<InType>): AsyncGeneratorWithId<InType>;
    getTransforms(): PipelineTransform<any, any>[];
}
export declare class Pipeline<InType, OutType = InType> implements IPipeline<InType, OutType> {
    source: AsyncGenerator<InType>;
    protected iterator: AsyncGenerator<OutType>;
    private isIterating;
    isCleaningUp: boolean;
    private definition;
    constructor(source: AsyncGenerator<InType>, definition?: PipelineDefinition<InType, OutType>);
    /**
     * Append a transformation step to this pipeline.
     * Changes the pipeline's output type to output type of this generator.
     */
    pipe<NewOutType>(fn: PipelineTransform<OutType, NewOutType>): Pipeline<InType, NewOutType>;
    /**
     * Inject pipeline step before other transforms.
     * Note must return same type as source, otherwise we can't be type-safe.
     */
    pipeBefore(fn: PipelineTransform<InType, InType>): Pipeline<InType, OutType>;
    /**
     * Fires this callback the moment this part of the pipeline starts returning.
     */
    onConsumed(fn: () => void | Promise<void>): Pipeline<InType, Awaited<OutType>>;
    /**
     * Triggers once when pipeline ends.
     * Usage: `pipeline.onFinally(callback)`
     */
    onFinally: Signal<[Error | undefined]>;
    /**
     * Triggers once when pipeline is about to end.
     */
    onBeforeFinally: Signal<[]>;
    /**
     * Triggers once when pipeline starts flowing.
     * Usage: `pipeline.onStart(callback)`
     */
    onStart: Signal<[]>;
    onMessage: Signal<[OutType]>;
    onError: Signal<[Error, (InType | OutType | undefined)?, (number | undefined)?]>;
    map<NewOutType>(fn: G.GeneratorMap<OutType, NewOutType>): Pipeline<InType, NewOutType>;
    mapBefore(fn: G.GeneratorMap<InType, InType>): Pipeline<InType, OutType>;
    forEach(fn: G.GeneratorForEach<OutType>): Pipeline<InType, OutType>;
    filter(fn: G.GeneratorFilter<OutType>): Pipeline<InType, OutType>;
    reduce<NewOutType>(fn: G.GeneratorReduce<OutType, NewOutType>, initialValue: NewOutType): Pipeline<InType, NewOutType>;
    forEachBefore(fn: G.GeneratorForEach<InType>): Pipeline<InType, OutType>;
    filterBefore(fn: G.GeneratorFilter<InType>): Pipeline<InType, OutType>;
    consume(fn?: G.GeneratorForEach<OutType>): Promise<void>;
    collect(n?: number): Promise<OutType[]>;
    flow(): this;
    private cleanup;
    handleError(err: Error): Promise<void>;
    private iterate;
    throw(err: Error): Promise<IteratorResult<OutType, any>>;
    return(v?: OutType): Promise<IteratorResult<OutType, any>>;
    next(): Promise<IteratorResult<OutType, any>>;
    /**
     * Create a new Pipeline forked from this pipeline.
     * Pushes results into fork.
     * Note: Does not start consuming this pipeline.
     */
    [Symbol.asyncIterator](): this;
}
export {};
