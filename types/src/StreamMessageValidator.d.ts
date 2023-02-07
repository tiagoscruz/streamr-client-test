import { EthereumAddress } from "@streamr/utils";
import { StreamID, StreamMessage } from "@streamr/protocol";
export interface Options {
    getPartitionCount: (streamId: StreamID) => Promise<number>;
    isPublisher: (address: EthereumAddress, streamId: StreamID) => Promise<boolean>;
    isSubscriber: (address: EthereumAddress, streamId: StreamID) => Promise<boolean>;
    verify?: (address: EthereumAddress, payload: string, signature: string) => boolean;
}
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
export default class StreamMessageValidator {
    readonly getPartitionCount: (streamId: StreamID) => Promise<number>;
    readonly isPublisher: (address: EthereumAddress, streamId: StreamID) => Promise<boolean>;
    readonly isSubscriber: (address: EthereumAddress, streamId: StreamID) => Promise<boolean>;
    readonly verify: (address: EthereumAddress, payload: string, signature: string) => boolean;
    /**
     * @param getStream async function(streamId): returns the metadata required for stream validation for streamId.
     *        The included fields should be at least: { partitions }
     * @param isPublisher async function(address, streamId): returns true if address is a permitted publisher on streamId
     * @param isSubscriber async function(address, streamId): returns true if address is a permitted subscriber on streamId
     * @param verify function(address, payload, signature): returns true if the address and payload match the signature.
     * The default implementation uses the native secp256k1 library on node.js and falls back to the elliptic library on browsers.
     */
    constructor({ getPartitionCount, isPublisher, isSubscriber, verify }: Options);
    /**
     * Checks that the given StreamMessage is satisfies the requirements of the protocol.
     * This includes checking permissions as well as signature. The method supports all
     * message types defined by the protocol.
     *
     * Resolves the promise if the message is valid, rejects otherwise.
     *
     * @param streamMessage the StreamMessage to validate.
     */
    validate(streamMessage: StreamMessage): Promise<void>;
    /**
     * Checks that the signature in the given StreamMessage is cryptographically valid.
     * Resolves if valid, rejects otherwise.
     *
     * It's left up to the user of this method to decide which implementation to pass in as the verifyFn.
     *
     * @param streamMessage the StreamMessage to validate.
     * @param verifyFn function(address, payload, signature): return true if the address and payload match the signature
     */
    private assertSignatureIsValid;
    private validateMessage;
    private validateGroupKeyRequest;
    private validateGroupKeyResponse;
}
