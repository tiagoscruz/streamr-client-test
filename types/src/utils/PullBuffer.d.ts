import * as G from './GeneratorUtils';
import { PushBuffer } from './PushBuffer';
/**
 * Pull from a source into self.
 */
export declare class PullBuffer<InType> extends PushBuffer<InType> {
    private source;
    constructor(source: AsyncGenerator<InType>, ...args: ConstructorParameters<typeof PushBuffer>);
    map<NewOutType>(fn: G.GeneratorMap<InType, NewOutType>): PullBuffer<NewOutType>;
    forEach(fn: G.GeneratorForEach<InType>): PullBuffer<InType>;
    filter(fn: G.GeneratorFilter<InType>): PullBuffer<InType>;
    reduce<NewOutType>(fn: G.GeneratorReduce<InType, NewOutType>, initialValue: NewOutType): PullBuffer<NewOutType>;
}
