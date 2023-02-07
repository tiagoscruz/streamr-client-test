import { Message, MessageMetadata } from './../Message';
export type MessageListener = (content: unknown, metadata: MessageMetadata) => unknown | Promise<unknown>;
/**
 * Provides asynchronous iteration with
 * {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for-await...of | for await .. of}.
 */
export declare class MessageStream implements AsyncIterable<Message> {
    private readonly pipeline;
    [Symbol.asyncIterator](): AsyncIterator<Message>;
}
