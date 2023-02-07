import { StreamMessage } from '@streamr/protocol';
import { Signal } from './../utils/Signal';
type ProcessMessageFn = (streamMessage: StreamMessage) => Promise<StreamMessage>;
type OnError = Signal<[Error, StreamMessage?, number?]>;
export declare class MsgChainUtil implements AsyncIterable<StreamMessage> {
    private readonly outputBuffer;
    private readonly processors;
    private readonly processMessageFn;
    private readonly onError;
    constructor(processMessageFn: ProcessMessageFn, onError: OnError);
    addMessage(message: StreamMessage): void;
    flush(): Promise<void>;
    stop(): void;
    [Symbol.asyncIterator](): AsyncIterator<StreamMessage>;
}
export {};
