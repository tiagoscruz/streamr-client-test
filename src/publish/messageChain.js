"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMessageRef = exports.createRandomMsgChainId = void 0;
const protocol_1 = require("@streamr/protocol");
const utils_1 = require("@streamr/utils");
const createRandomMsgChainId = () => (0, utils_1.randomString)(20);
exports.createRandomMsgChainId = createRandomMsgChainId;
/**
 * Generate the next message MessageID for a message chain.
 * Messages with same timestamp get incremented sequence numbers.
 */
const createMessageRef = (timestamp, prevMsgRef) => {
    // NOTE: publishing back-dated (i.e. non-sequentially timestamped) messages will 'break' sequencing.
    // i.e. we lose track of biggest sequence number whenever timestamp changes for stream id+partition combo
    // so backdated messages will start at sequence 0 again, regardless of the sequencing of existing messages.
    // storage considers timestamp+sequence number unique, so the newer messages will clobber the older messages
    // Not feasible to keep greatest sequence number for every millisecond timestamp so not sure a good way around this.
    // Possible we should keep a global sequence number
    // The sequence breaking issue above can be "fixed" if we throw an exception for backdated timestamp.
    // In that case we don't publish the message and the backdated timestamp won't be useds as prevMsgRef
    // for a possible subsequent publish request.
    const isBackdated = (prevMsgRef !== undefined) && (timestamp < prevMsgRef.timestamp);
    if (isBackdated) {
        throw new Error('prevMessageRef must come before current');
    }
    const isSameTimestamp = (prevMsgRef !== undefined) && (prevMsgRef.timestamp === timestamp);
    const nextSequenceNumber = isSameTimestamp ? prevMsgRef.sequenceNumber + 1 : 0;
    const createdMessageRef = new protocol_1.MessageRef(timestamp, nextSequenceNumber);
    return createdMessageRef;
};
exports.createMessageRef = createMessageRef;
//# sourceMappingURL=messageChain.js.map