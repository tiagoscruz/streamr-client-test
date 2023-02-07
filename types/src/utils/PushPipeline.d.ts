import { IPushBuffer, PushBuffer } from './PushBuffer';
import * as G from './GeneratorUtils';
import { Pipeline, PipelineTransform } from './Pipeline';
/**
 * Pipeline that is also a PushBuffer.
 * i.e. can call .push to push data into pipeline and .pipe to transform it.
 */
export declare class PushPipeline<InType, OutType = InType> extends Pipeline<InType, OutType> implements IPushBuffer<InType, OutType> {
    readonly source: PushBuffer<InType>;
    constructor(bufferSize?: number);
    pipe<NewOutType>(fn: PipelineTransform<OutType, NewOutType>): PushPipeline<InType, NewOutType>;
    map<NewOutType>(fn: G.GeneratorMap<OutType, NewOutType>): PushPipeline<InType, NewOutType>;
    mapBefore(fn: G.GeneratorMap<InType, InType>): PushPipeline<InType, OutType>;
    filterBefore(fn: G.GeneratorFilter<InType>): PushPipeline<InType, OutType>;
    filter(fn: G.GeneratorFilter<OutType>): PushPipeline<InType, OutType>;
    forEach(fn: G.GeneratorForEach<OutType>): PushPipeline<InType, OutType>;
    forEachBefore(fn: G.GeneratorForEach<InType>): PushPipeline<InType, OutType>;
    pull(source: AsyncGenerator<InType>): Promise<void>;
    push(item: InType | Error): Promise<boolean>;
    handleError(err: Error): Promise<void>;
    end(err?: Error): void;
    endWrite(err?: Error): void;
    isDone(): boolean;
    get length(): number;
    clear(): void;
}
