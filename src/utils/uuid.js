"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uuid = exports.SEPARATOR = void 0;
const uuid_1 = require("uuid");
const uniqueId_1 = __importDefault(require("lodash/uniqueId"));
exports.SEPARATOR = '-';
let UUID;
function uuid(label = '') {
    if (typeof UUID === 'undefined') {
        // Create UUID on the first use of the function in order to avoid premature `uuidv4` calls.
        // Doing it outside will break browser projects that utilize server-side rendering (no
        // `window` while build's target is `web`).
        UUID = (0, uuid_1.v4)();
    }
    // Incrementing + human readable uuid
    return (0, uniqueId_1.default)(`${UUID}${label ? `${exports.SEPARATOR}${label}` : ''}`);
}
exports.uuid = uuid;
//# sourceMappingURL=uuid.js.map