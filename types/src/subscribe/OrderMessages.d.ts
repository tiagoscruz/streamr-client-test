import { StreamMessage, StreamPartID, MessageRef } from '@streamr/protocol';
import { Resends } from './Resends';
import { StrictStreamrClientConfig } from '../Config';
import { EthereumAddress } from '@streamr/utils';
import { LoggerFactory } from '../utils/LoggerFactory';
/**
 * Wraps OrderingUtil into a PushBuffer.
 * Implements gap filling
 */
export declare class OrderMessages {
    private config;
    private resends;
    private readonly streamPartId;
    private readonly logger;
    private stopSignal;
    private done;
    private resendStreams;
    private outBuffer;
    private inputClosed;
    private orderMessages;
    private enabled;
    private orderingUtil;
    constructor(config: StrictStreamrClientConfig, resends: Resends, streamPartId: StreamPartID, loggerFactory: LoggerFactory);
    onGap(from: MessageRef, to: MessageRef, publisherId: EthereumAddress, msgChainId: string): Promise<void>;
    onOrdered(orderedMessage: StreamMessage): void;
    stop(): Promise<void>;
    maybeClose(): void;
    addToOrderingUtil(src: AsyncGenerator<StreamMessage>): Promise<void>;
    transform(): (src: AsyncGenerator<StreamMessage, any, unknown>) => AsyncGenerator<StreamMessage>;
}
