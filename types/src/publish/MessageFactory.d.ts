import { StreamID, StreamMessage, StreamMessageOptions } from '@streamr/protocol';
import { PublishMetadata } from './Publisher';
import { GroupKeyQueue } from './GroupKeyQueue';
import { Authentication } from '../Authentication';
import { StreamRegistryCached } from '../registry/StreamRegistryCached';
export interface MessageFactoryOptions {
    streamId: StreamID;
    authentication: Authentication;
    streamRegistry: Pick<StreamRegistryCached, 'getStream' | 'isPublic' | 'isStreamPublisher'>;
    groupKeyQueue: GroupKeyQueue;
}
export declare const createSignedMessage: <T>(opts: Omit<StreamMessageOptions<T>, "content" | "signature"> & {
    serializedContent: string;
    authentication: Authentication;
}) => Promise<StreamMessage<T>>;
export declare class MessageFactory {
    private readonly streamId;
    private readonly authentication;
    private defaultPartition;
    private readonly defaultMessageChainIds;
    private readonly prevMsgRefs;
    private readonly streamRegistry;
    private readonly groupKeyQueue;
    constructor(opts: MessageFactoryOptions);
    createMessage<T>(content: T, metadata: PublishMetadata & {
        timestamp: number;
    }, explicitPartition?: number): Promise<StreamMessage<T>>;
    private getDefaultPartition;
}
