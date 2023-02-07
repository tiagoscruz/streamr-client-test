import { GroupKey } from './GroupKey';
import { StreamID } from '@streamr/protocol';
import { Authentication } from '../Authentication';
import { StreamrClientEventEmitter } from '../events';
import { Persistence } from '../utils/persistence/Persistence';
import { LoggerFactory } from '../utils/LoggerFactory';
/**
 * @privateRemarks
 *
 * In the client API we use the term EncryptionKey instead of GroupKey.
 * The GroupKey name comes from the protocol. TODO: we could rename all classes
 * and methods to use the term EncryptionKey (except protocol-classes, which
 * should use the protocol level term GroupKey)
 */
export interface UpdateEncryptionKeyOptions {
    /**
     * The Stream ID for which this key update applies.
     */
    streamId: string;
    /**
     * Determines how the new key will be distributed to subscribers.
     *
     * @remarks
     * With `rotate`, the new key will be sent to the stream alongside the next published message. The key will be
     * encrypted using the current key. Only after this will the new key be used for publishing. This
     * provides forward secrecy.
     *
     * With `rekey`, we for each subscriber to fetch the new key individually. This ensures each subscriber's
     * permissions are revalidated before they are given the new key.
     */
    distributionMethod: 'rotate' | 'rekey';
    /**
     * Provide a specific key to be used. If left undefined, a new key is generated automatically.
     */
    key?: GroupKey;
}
export declare class GroupKeyStore {
    private authentication;
    private eventEmitter;
    private readonly logger;
    private readonly ensureInitialized;
    private persistence;
    constructor(loggerFactory: LoggerFactory, authentication: Authentication, eventEmitter: StreamrClientEventEmitter, persistence: Persistence<string, string>);
    get(keyId: string, streamId: StreamID): Promise<GroupKey | undefined>;
    add(key: GroupKey, streamId: StreamID): Promise<void>;
    stop(): Promise<void>;
}
