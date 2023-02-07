"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const protocol_1 = require("@streamr/protocol");
const signingUtils_1 = require("./utils/signingUtils");
/**
 * Validates observed StreamMessages according to protocol rules, regardless of observer.
 * Functions needed for external interactions are injected as constructor args.
 *
 * The recoverAddressFn function could be imported from eg. ethers, but it would explode the bundle size, so
 * better leave it up to whoever is the end user of this class to choose which library they use.
 *
 * Note that most checks can not be performed for unsigned messages. Checking message integrity is impossible,
 * and checking permissions would require knowing the identity of the publisher, so it can't be done here.
 *
 * TODO later: support for unsigned messages can be removed when deprecated system-wide.
 */
class StreamMessageValidator {
    /**
     * @param getStream async function(streamId): returns the metadata required for stream validation for streamId.
     *        The included fields should be at least: { partitions }
     * @param isPublisher async function(address, streamId): returns true if address is a permitted publisher on streamId
     * @param isSubscriber async function(address, streamId): returns true if address is a permitted subscriber on streamId
     * @param verify function(address, payload, signature): returns true if the address and payload match the signature.
     * The default implementation uses the native secp256k1 library on node.js and falls back to the elliptic library on browsers.
     */
    constructor({ getPartitionCount, isPublisher, isSubscriber, verify = signingUtils_1.verify }) {
        this.getPartitionCount = getPartitionCount;
        this.isPublisher = isPublisher;
        this.isSubscriber = isSubscriber;
        this.verify = verify;
    }
    /**
     * Checks that the given StreamMessage is satisfies the requirements of the protocol.
     * This includes checking permissions as well as signature. The method supports all
     * message types defined by the protocol.
     *
     * Resolves the promise if the message is valid, rejects otherwise.
     *
     * @param streamMessage the StreamMessage to validate.
     */
    async validate(streamMessage) {
        if (!streamMessage) {
            throw new protocol_1.ValidationError('Falsey argument passed to validate()!');
        }
        await this.assertSignatureIsValid(streamMessage);
        switch (streamMessage.messageType) {
            case protocol_1.StreamMessageType.MESSAGE:
                return this.validateMessage(streamMessage);
            case protocol_1.StreamMessageType.GROUP_KEY_REQUEST:
                return this.validateGroupKeyRequest(streamMessage);
            case protocol_1.StreamMessageType.GROUP_KEY_RESPONSE:
                return this.validateGroupKeyResponse(streamMessage);
            default:
                throw new protocol_1.StreamMessageError(`Unknown message type: ${streamMessage.messageType}!`, streamMessage);
        }
    }
    /**
     * Checks that the signature in the given StreamMessage is cryptographically valid.
     * Resolves if valid, rejects otherwise.
     *
     * It's left up to the user of this method to decide which implementation to pass in as the verifyFn.
     *
     * @param streamMessage the StreamMessage to validate.
     * @param verifyFn function(address, payload, signature): return true if the address and payload match the signature
     */
    async assertSignatureIsValid(streamMessage) {
        const payload = (0, protocol_1.createSignaturePayload)({
            messageId: streamMessage.getMessageID(),
            serializedContent: streamMessage.getSerializedContent(),
            prevMsgRef: streamMessage.prevMsgRef ?? undefined,
            newGroupKey: streamMessage.newGroupKey ?? undefined
        });
        let success;
        try {
            success = this.verify(streamMessage.getPublisherId(), payload, streamMessage.signature);
        }
        catch (err) {
            throw new protocol_1.StreamMessageError(`An error occurred during address recovery from signature: ${err}`, streamMessage);
        }
        if (!success) {
            throw new protocol_1.StreamMessageError('Signature validation failed', streamMessage);
        }
    }
    async validateMessage(streamMessage) {
        const partitionCount = await this.getPartitionCount(streamMessage.getStreamId());
        if (streamMessage.getStreamPartition() < 0 || streamMessage.getStreamPartition() >= partitionCount) {
            throw new protocol_1.StreamMessageError(`Partition ${streamMessage.getStreamPartition()} is out of range (0..${partitionCount - 1})`, streamMessage);
        }
        const sender = streamMessage.getPublisherId();
        // Check that the sender of the message is a valid publisher of the stream
        const senderIsPublisher = await this.isPublisher(sender, streamMessage.getStreamId());
        if (!senderIsPublisher) {
            throw new protocol_1.StreamMessageError(`${sender} is not a publisher on stream ${streamMessage.getStreamId()}.`, streamMessage);
        }
    }
    async validateGroupKeyRequest(streamMessage) {
        const groupKeyRequest = protocol_1.GroupKeyRequest.fromStreamMessage(streamMessage);
        const sender = streamMessage.getPublisherId();
        const streamId = streamMessage.getStreamId();
        const recipient = groupKeyRequest.recipient;
        // Check that the recipient of the request is a valid publisher of the stream
        const recipientIsPublisher = await this.isPublisher(recipient, streamId);
        if (!recipientIsPublisher) {
            throw new protocol_1.StreamMessageError(`${recipient} is not a publisher on stream ${streamId}.`, streamMessage);
        }
        // Check that the sender of the request is a valid subscriber of the stream
        const senderIsSubscriber = await this.isSubscriber(sender, streamId);
        if (!senderIsSubscriber) {
            throw new protocol_1.StreamMessageError(`${sender} is not a subscriber on stream ${streamId}.`, streamMessage);
        }
    }
    async validateGroupKeyResponse(streamMessage) {
        const groupKeyMessage = protocol_1.GroupKeyMessage.fromStreamMessage(streamMessage); // only streamId is read
        const sender = streamMessage.getPublisherId();
        const streamId = streamMessage.getStreamId();
        const recipient = groupKeyMessage.recipient;
        // Check that the sender of the request is a valid publisher of the stream
        const senderIsPublisher = await this.isPublisher(sender, streamId);
        if (!senderIsPublisher) {
            throw new protocol_1.StreamMessageError(`${sender} is not a publisher on stream ${streamId}. ${streamMessage.messageType}`, streamMessage);
        }
        // permit publishers to send error responses to invalid subscribers
        // Check that the recipient of the request is a valid subscriber of the stream
        const recipientIsSubscriber = await this.isSubscriber(recipient, streamId);
        if (!recipientIsSubscriber) {
            throw new protocol_1.StreamMessageError(`${recipient} is not a subscriber on stream ${streamId}. ${streamMessage.messageType}`, streamMessage);
        }
    }
}
exports.default = StreamMessageValidator;
//# sourceMappingURL=StreamMessageValidator.js.map