import { MessageRef } from '@streamr/protocol';
export declare const createRandomMsgChainId: () => string;
/**
 * Generate the next message MessageID for a message chain.
 * Messages with same timestamp get incremented sequence numbers.
 */
export declare const createMessageRef: (timestamp: number, prevMsgRef?: MessageRef) => MessageRef;
