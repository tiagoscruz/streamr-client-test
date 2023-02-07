import { MessageRef } from "@streamr/protocol";
import { EthereumAddress } from '@streamr/utils';
export default class GapFillFailedError extends Error {
    from: MessageRef;
    to: MessageRef;
    publisherId: EthereumAddress;
    msgChainId: string;
    constructor(from: MessageRef, to: MessageRef, publisherId: EthereumAddress, msgChainId: string, nbTrials: number);
}
