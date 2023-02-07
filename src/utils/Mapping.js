"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Mapping = void 0;
const utils_1 = require("./utils");
/*
 * A map data structure which lazily evaluates values. A factory function
 * is called to create a value when when an item is queried for the first time.
 * The map stores the value and any subsequent call to get() returns
 * the same value.
 */
class Mapping {
    constructor(valueFactory) {
        this.delegate = new Map();
        this.valueFactory = valueFactory;
    }
    async get(...args) {
        const key = (0, utils_1.formLookupKey)(...args);
        let valueWrapper = this.delegate.get(key);
        if (valueWrapper === undefined) {
            const value = await this.valueFactory(...args);
            valueWrapper = { value };
            this.delegate.set(key, valueWrapper);
        }
        return valueWrapper.value;
    }
}
exports.Mapping = Mapping;
//# sourceMappingURL=Mapping.js.map