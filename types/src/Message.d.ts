import { EthereumAddress } from '@streamr/utils';
import { StreamID, StreamMessage } from '@streamr/protocol';
/**
 * Represents a message in the Streamr Network.
 *
 * @category Important
 */
export interface Message {
    /**
     * The message contents / payload.
     */
    content: unknown;
    /**
     * Identifies the stream the message was published to.
     */
    streamId: StreamID;
    /**
     * The partition number the message was published to.
     */
    streamPartition: number;
    /**
     * The timestamp of when the message was published.
     */
    timestamp: number;
    /**
     * Tiebreaker used to determine order in the case of multiple messages within a message chain having the same exact timestamp.
     */
    sequenceNumber: number;
    /**
     * Signature of message signed by publisher.
     */
    signature: string;
    /**
     * Publisher of message.
     */
    publisherId: EthereumAddress;
    /**
     * Identifies the message chain the message was published to.
     */
    msgChainId: string;
}
export type MessageMetadata = Omit<Message, 'content'>;
export declare const convertStreamMessageToMessage: (msg: StreamMessage) => Message;
