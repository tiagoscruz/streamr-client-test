import { StreamID, StreamPartID } from '@streamr/protocol';
import { StreamDefinition } from './types';
import { Authentication } from './Authentication';
export declare const DEFAULT_PARTITION = 0;
export declare class StreamIDBuilder {
    private authentication;
    constructor(authentication: Authentication);
    toStreamID(streamIdOrPath: string): Promise<StreamID>;
    toStreamPartID(definition: StreamDefinition): Promise<StreamPartID>;
    toStreamPartElements(definition: StreamDefinition): Promise<[StreamID, number | undefined]>;
    match(definition: StreamDefinition, streamPartId: StreamPartID): Promise<boolean>;
}
