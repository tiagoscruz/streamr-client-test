"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageFactory = exports.createSignedMessage = void 0;
const lodash_1 = require("lodash");
const protocol_1 = require("@streamr/protocol");
const EncryptionUtil_1 = require("../encryption/EncryptionUtil");
const messageChain_1 = require("./messageChain");
const utils_1 = require("@streamr/utils");
const Mapping_1 = require("../utils/Mapping");
const utils_2 = require("../utils/utils");
const StreamrClientError_1 = require("../StreamrClientError");
const createSignedMessage = async (opts) => {
    const signature = await opts.authentication.createMessageSignature((0, protocol_1.createSignaturePayload)({
        messageId: opts.messageId,
        serializedContent: opts.serializedContent,
        prevMsgRef: opts.prevMsgRef ?? undefined,
        newGroupKey: opts.newGroupKey ?? undefined
    }));
    return new protocol_1.StreamMessage({
        ...opts,
        signature,
        content: opts.serializedContent,
    });
};
exports.createSignedMessage = createSignedMessage;
class MessageFactory {
    constructor(opts) {
        this.prevMsgRefs = new Map();
        this.streamId = opts.streamId;
        this.authentication = opts.authentication;
        this.streamRegistry = opts.streamRegistry;
        this.groupKeyQueue = opts.groupKeyQueue;
        this.defaultMessageChainIds = new Mapping_1.Mapping(async (_partition) => {
            return (0, messageChain_1.createRandomMsgChainId)();
        });
    }
    /* eslint-disable padding-line-between-statements */
    async createMessage(content, metadata, explicitPartition) {
        const publisherId = await this.authentication.getAddress();
        const isPublisher = await this.streamRegistry.isStreamPublisher(this.streamId, publisherId);
        if (!isPublisher) {
            throw new StreamrClientError_1.StreamrClientError(`You don't have permission to publish to this stream. Using address: ${publisherId}`, 'MISSING_PERMISSION');
        }
        const partitionCount = (await this.streamRegistry.getStream(this.streamId)).getMetadata().partitions;
        let partition;
        if (explicitPartition !== undefined) {
            if ((explicitPartition < 0 || explicitPartition >= partitionCount)) {
                throw new Error(`Partition ${explicitPartition} is out of range (0..${partitionCount - 1})`);
            }
            if (metadata.partitionKey !== undefined) {
                throw new Error('Invalid combination of "partition" and "partitionKey"');
            }
            partition = explicitPartition;
        }
        else {
            partition = (metadata.partitionKey !== undefined)
                ? (0, utils_1.keyToArrayIndex)(partitionCount, metadata.partitionKey)
                : this.getDefaultPartition(partitionCount);
        }
        const msgChainId = metadata.msgChainId ?? await this.defaultMessageChainIds.get(partition);
        const msgChainKey = (0, utils_2.formLookupKey)(partition, msgChainId);
        const prevMsgRef = this.prevMsgRefs.get(msgChainKey);
        const msgRef = (0, messageChain_1.createMessageRef)(metadata.timestamp, prevMsgRef);
        this.prevMsgRefs.set(msgChainKey, msgRef);
        const messageId = new protocol_1.MessageID(this.streamId, partition, msgRef.timestamp, msgRef.sequenceNumber, publisherId, msgChainId);
        const encryptionType = (await this.streamRegistry.isPublic(this.streamId)) ? protocol_1.EncryptionType.NONE : protocol_1.EncryptionType.AES;
        let groupKeyId;
        let newGroupKey;
        let serializedContent = JSON.stringify(content);
        if (encryptionType === protocol_1.EncryptionType.AES) {
            const keySequence = await this.groupKeyQueue.useGroupKey();
            serializedContent = EncryptionUtil_1.EncryptionUtil.encryptWithAES(Buffer.from(serializedContent, 'utf8'), keySequence.current.data);
            groupKeyId = keySequence.current.id;
            if (keySequence.next !== undefined) {
                newGroupKey = keySequence.current.encryptNextGroupKey(keySequence.next);
            }
        }
        return (0, exports.createSignedMessage)({
            messageId,
            serializedContent,
            prevMsgRef,
            encryptionType,
            groupKeyId,
            newGroupKey,
            authentication: this.authentication
        });
    }
    getDefaultPartition(partitionCount) {
        // we want to (re-)select a random partition in these two situations
        // 1) this is the first publish, and we have not yet selected any partition (the most typical case)
        // 2) the partition count may have decreased since we initially selected a random partitions, and it
        //    is now out-of-range (very rare case)
        if ((this.defaultPartition === undefined) || (this.defaultPartition >= partitionCount)) {
            this.defaultPartition = (0, lodash_1.random)(partitionCount - 1);
        }
        return this.defaultPartition;
    }
}
exports.MessageFactory = MessageFactory;
//# sourceMappingURL=MessageFactory.js.map