import { StreamMessage } from '@streamr/protocol';
import { StreamRegistryCached } from './registry/StreamRegistryCached';
import StreamMessageValidator from './StreamMessageValidator';
/**
 * Wrap StreamMessageValidator in a way that ensures it can validate in parallel but
 * validation is guaranteed to resolve in the same order they were called
 * Handles caching remote calls
 */
export declare class Validator extends StreamMessageValidator {
    private isStopped;
    private doValidation;
    constructor(streamRegistryCached: StreamRegistryCached);
    orderedValidate: ((msg: StreamMessage<unknown>) => Promise<any>) & {
        clear(): void;
    };
    validate(msg: StreamMessage): Promise<void>;
    stop(): void;
}
