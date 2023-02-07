import { StreamID } from '@streamr/protocol';
import { StrictStreamrClientConfig } from './Config';
import { StreamrClientEventEmitter } from './events';
import { Publisher } from './publish/Publisher';
import { StreamRegistry } from './registry/StreamRegistry';
import { StreamRegistryCached } from './registry/StreamRegistryCached';
import { StreamStorageRegistry } from './registry/StreamStorageRegistry';
import { Stream, StreamMetadata } from './Stream';
import { Resends } from './subscribe/Resends';
import { Subscriber } from './subscribe/Subscriber';
import { LoggerFactory } from './utils/LoggerFactory';
export declare class StreamFactory {
    private readonly resends;
    private readonly publisher;
    private readonly subscriber;
    private readonly streamRegistryCached;
    private readonly streamRegistry;
    private readonly streamStorageRegistry;
    private readonly loggerFactory;
    private readonly eventEmitter;
    private readonly config;
    constructor(resends: Resends, publisher: Publisher, subscriber: Subscriber, streamRegistryCached: StreamRegistryCached, streamRegistry: StreamRegistry, streamStorageRegistry: StreamStorageRegistry, loggerFactory: LoggerFactory, eventEmitter: StreamrClientEventEmitter, config: Pick<StrictStreamrClientConfig, '_timeouts'>);
    createStream(id: StreamID, metadata: Partial<StreamMetadata>): Stream;
}
