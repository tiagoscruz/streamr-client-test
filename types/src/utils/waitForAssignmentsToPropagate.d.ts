import { StreamID } from '@streamr/protocol';
import { MessageStream } from '../subscribe/MessageStream';
export declare function waitForAssignmentsToPropagate(messageStream: MessageStream, targetStream: {
    id: StreamID;
    partitions: number;
}): Promise<string[]>;
