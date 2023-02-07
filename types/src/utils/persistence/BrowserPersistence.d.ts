import { Persistence } from './Persistence';
import { StreamID } from '@streamr/protocol';
export default class BrowserPersistence implements Persistence<string, string> {
    private getStore;
    constructor({ clientId }: {
        clientId: string;
    });
    get(key: string, streamId: StreamID): Promise<string | undefined>;
    set(key: string, value: string, streamId: StreamID): Promise<void>;
    close(): Promise<void>;
    get [Symbol.toStringTag](): string;
}
