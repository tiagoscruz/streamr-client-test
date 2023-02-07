import { Database } from 'sqlite';
import { Persistence } from './Persistence';
import { StreamID } from '@streamr/protocol';
import { LoggerFactory } from '../LoggerFactory';
export interface ServerPersistenceOptions {
    loggerFactory: LoggerFactory;
    tableName: string;
    valueColumnName: string;
    clientId: string;
    migrationsPath?: string;
    onInit?: (db: Database) => Promise<void>;
}
export default class ServerPersistence implements Persistence<string, string> {
    private readonly logger;
    private readonly tableName;
    private readonly valueColumnName;
    private readonly dbFilePath;
    private store?;
    private error?;
    private initCalled;
    private readonly migrationsPath?;
    private readonly onInit?;
    constructor({ loggerFactory, clientId, tableName, valueColumnName, migrationsPath, onInit }: ServerPersistenceOptions);
    exists(): Promise<boolean>;
    private tryExec;
    init(): Promise<void>;
    get(key: string, streamId: StreamID): Promise<string | undefined>;
    set(key: string, value: string, streamId: StreamID): Promise<void>;
    close(): Promise<void>;
    get [Symbol.toStringTag](): string;
}
