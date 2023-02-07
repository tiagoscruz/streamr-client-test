"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.waitForAssignmentsToPropagate = void 0;
const GeneratorUtils_1 = require("./GeneratorUtils");
const protocol_1 = require("@streamr/protocol");
const lodash_1 = require("lodash");
function waitForAssignmentsToPropagate(messageStream, targetStream) {
    return (0, GeneratorUtils_1.collect)((0, GeneratorUtils_1.unique)(messageStream
        .map((msg) => msg.getParsedContent().streamPart)
        .filter((input) => {
        try {
            const streamPartId = protocol_1.StreamPartIDUtils.parse(input);
            const [streamId, partition] = protocol_1.StreamPartIDUtils.getStreamIDAndPartition(streamPartId);
            return streamId === targetStream.id && partition < targetStream.partitions;
        }
        catch {
            return false;
        }
    }), lodash_1.identity), targetStream.partitions);
}
exports.waitForAssignmentsToPropagate = waitForAssignmentsToPropagate;
//# sourceMappingURL=waitForAssignmentsToPropagate.js.map