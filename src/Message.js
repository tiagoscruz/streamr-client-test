"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertStreamMessageToMessage = void 0;
const convertStreamMessageToMessage = (msg) => {
    return {
        content: msg.getParsedContent(),
        streamId: msg.getStreamId(),
        streamPartition: msg.getStreamPartition(),
        timestamp: msg.getTimestamp(),
        sequenceNumber: msg.getSequenceNumber(),
        signature: msg.signature,
        publisherId: msg.getPublisherId(),
        msgChainId: msg.getMsgChainId(),
        streamMessage: msg
        // TODO add other relevant fields (could update some test assertions to
        // use those keys instead of getting the fields via from streamMessage property)
    };
};
exports.convertStreamMessageToMessage = convertStreamMessageToMessage;
//# sourceMappingURL=Message.js.map