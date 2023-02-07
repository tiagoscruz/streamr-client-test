"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const env_paths_1 = __importDefault(require("env-paths"));
const path_1 = require("path");
const fs_1 = require("fs");
const sqlite_1 = require("sqlite");
const sqlite3_1 = __importDefault(require("sqlite3"));
const promises_1 = require("../promises");
const utils_1 = require("@streamr/utils");
/*
 * Stores key-value pairs for a given stream
 */
class ServerPersistence {
    constructor({ loggerFactory, clientId, tableName, valueColumnName, migrationsPath, onInit }) {
        this.initCalled = false;
        this.logger = loggerFactory.createLogger(module);
        this.tableName = tableName;
        this.valueColumnName = valueColumnName;
        const paths = (0, env_paths_1.default)('streamr-client');
        const dbFilePath = (0, path_1.resolve)(paths.data, (0, path_1.join)('./', clientId, `${tableName}.db`));
        this.dbFilePath = dbFilePath;
        this.migrationsPath = migrationsPath;
        this.onInit = onInit;
        this.init = (0, promises_1.pOnce)(this.init.bind(this));
    }
    async exists() {
        if (this.initCalled) {
            // wait for init if in progress
            await this.init();
        }
        try {
            await fs_1.promises.access(this.dbFilePath);
            return true;
        }
        catch (err) {
            if (err.code === 'ENOENT') {
                return false;
            }
            throw err;
        }
    }
    async tryExec(fn, maxRetries = 10, retriesLeft = maxRetries) {
        try {
            return await fn();
        }
        catch (err) {
            if (retriesLeft > 0 && err.code === 'SQLITE_BUSY') {
                this.logger.trace('database busy, retrying %d of %d', maxRetries - retriesLeft + 1, maxRetries);
                return this.tryExec(async () => {
                    // wait random time and retry
                    await (0, utils_1.wait)(10 + Math.random() * 500);
                    return fn();
                }, maxRetries, retriesLeft - 1);
            }
            throw err;
        }
    }
    async init() {
        this.initCalled = true;
        try {
            await fs_1.promises.mkdir((0, path_1.dirname)(this.dbFilePath), { recursive: true });
            // open the database
            const store = await (0, sqlite_1.open)({
                filename: this.dbFilePath,
                driver: sqlite3_1.default.Database
            });
            await this.tryExec(async () => {
                await store.configure('busyTimeout', 200);
                await store.run('PRAGMA journal_mode = WAL;');
            });
            if (this.migrationsPath !== undefined) {
                await this.tryExec(async () => {
                    try {
                        await store.migrate({
                            migrationsPath: this.migrationsPath
                        });
                    }
                    catch (err) {
                        if (err.code.startsWith('SQLITE_')) {
                            // ignore: some other migration is probably running, assume that worked
                            return;
                        }
                        throw err;
                    }
                });
            }
            await this.onInit?.(store);
            this.store = store;
        }
        catch (err) {
            this.logger.trace('failed to open database, reason: %s', err);
            if (!this.error) {
                this.error = err;
            }
        }
        if (this.error) {
            throw this.error;
        }
        this.logger.trace('database initialized');
    }
    async get(key, streamId) {
        if (!this.initCalled) {
            // can't have if doesn't exist
            if (!(await this.exists())) {
                return undefined;
            }
        }
        await this.init();
        const value = await this.store.get(`SELECT ${this.valueColumnName} FROM ${this.tableName} WHERE id = ? AND streamId = ?`, key, encodeURIComponent(streamId));
        return value?.[this.valueColumnName];
    }
    async set(key, value, streamId) {
        await this.init();
        await this.store.run(`INSERT INTO ${this.tableName} VALUES ($id, $${this.valueColumnName}, $streamId) ON CONFLICT DO NOTHING`, {
            $id: key,
            [`$${this.valueColumnName}`]: value,
            $streamId: encodeURIComponent(streamId),
        });
    }
    async close() {
        if (!this.initCalled) {
            // nothing to close if never opened
            return;
        }
        await this.init();
        await this.store.close();
        this.logger.trace('closed');
    }
    get [Symbol.toStringTag]() {
        return this.constructor.name;
    }
}
exports.default = ServerPersistence;
//# sourceMappingURL=ServerPersistence.js.map