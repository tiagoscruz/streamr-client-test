"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StreamrClientError = void 0;
class StreamrClientError extends Error {
    constructor(message, code) {
        super(message);
        this.code = code;
        this.name = this.constructor.name;
    }
}
exports.StreamrClientError = StreamrClientError;
//# sourceMappingURL=StreamrClientError.js.map