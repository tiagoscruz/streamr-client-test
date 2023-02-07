import { StreamMessage } from '@streamr/protocol';
import OrderedMsgChain, { GapHandler, MessageHandler, MsgChainEmitter } from './OrderedMsgChain';
export default class OrderingUtil extends MsgChainEmitter {
    inOrderHandler: MessageHandler;
    gapHandler: GapHandler;
    propagationTimeout?: number;
    resendTimeout?: number;
    maxGapRequests?: number;
    orderedChains: Record<string, OrderedMsgChain>;
    constructor(inOrderHandler: MessageHandler, gapHandler: GapHandler, propagationTimeout?: number, resendTimeout?: number, maxGapRequests?: number);
    add(unorderedStreamMessage: StreamMessage): void;
    private getChain;
    markMessageExplicitly(streamMessage: StreamMessage): void;
    isEmpty(): boolean;
    clearGaps(): void;
    disable(): void;
}
