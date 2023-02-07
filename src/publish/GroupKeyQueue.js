"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GroupKeyQueue = void 0;
const GroupKey_1 = require("../encryption/GroupKey");
class GroupKeyQueue {
    constructor(streamId, store) {
        this.streamId = streamId;
        this.store = store;
    }
    async useGroupKey() {
        // Ensure we have a current key by picking a queued key or generating a new one
        if (!this.currentGroupKey) {
            this.currentGroupKey = this.queuedGroupKey || await this.rekey();
            this.queuedGroupKey = undefined;
        }
        // Always return an array consisting of currentGroupKey and queuedGroupKey (latter may be undefined)
        const result = {
            current: this.currentGroupKey,
            next: this.queuedGroupKey,
        };
        // Perform the rotate if there's a next key queued
        if (this.queuedGroupKey) {
            this.currentGroupKey = this.queuedGroupKey;
            this.queuedGroupKey = undefined;
        }
        return result;
    }
    async rotate(newKey = GroupKey_1.GroupKey.generate()) {
        this.queuedGroupKey = newKey;
        await this.store.add(newKey, this.streamId);
        return newKey;
    }
    async rekey(newKey = GroupKey_1.GroupKey.generate()) {
        await this.store.add(newKey, this.streamId);
        this.currentGroupKey = newKey;
        this.queuedGroupKey = undefined;
        return newKey;
    }
}
exports.GroupKeyQueue = GroupKeyQueue;
//# sourceMappingURL=GroupKeyQueue.js.map