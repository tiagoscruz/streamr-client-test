"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PullBuffer = void 0;
const G = __importStar(require("./GeneratorUtils"));
const PushBuffer_1 = require("./PushBuffer");
/**
 * Pull from a source into self.
 */
class PullBuffer extends PushBuffer_1.PushBuffer {
    constructor(source, ...args) {
        super(...args);
        this.source = source;
        (0, PushBuffer_1.pull)(this.source, this).catch(() => { });
    }
    map(fn) {
        return new PullBuffer(G.map(this, fn), this.bufferSize);
    }
    forEach(fn) {
        return new PullBuffer(G.forEach(this, fn), this.bufferSize);
    }
    filter(fn) {
        return new PullBuffer(G.filter(this, fn), this.bufferSize);
    }
    reduce(fn, initialValue) {
        return new PullBuffer(G.reduce(this, fn, initialValue), this.bufferSize);
    }
}
exports.PullBuffer = PullBuffer;
//# sourceMappingURL=PullBuffer.js.map