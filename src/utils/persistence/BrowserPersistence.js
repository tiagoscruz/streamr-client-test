"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const idb_keyval_1 = require("idb-keyval");
const lodash_1 = require("lodash");
class BrowserPersistence {
    constructor({ clientId }) {
        this.getStore = (0, lodash_1.memoize)((streamId) => {
            const dbName = `streamr-client::${clientId}::${streamId}`;
            return (0, idb_keyval_1.createStore)(dbName, 'GroupKeys');
        });
    }
    async get(key, streamId) {
        return (0, idb_keyval_1.get)(key, this.getStore(streamId));
    }
    async set(key, value, streamId) {
        await (0, idb_keyval_1.set)(key, value, this.getStore(streamId));
    }
    // eslint-disable-next-line class-methods-use-this
    async close() {
        // noop
    }
    get [Symbol.toStringTag]() {
        return this.constructor.name;
    }
}
exports.default = BrowserPersistence;
//# sourceMappingURL=BrowserPersistence.js.map