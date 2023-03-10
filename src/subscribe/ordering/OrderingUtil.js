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
const OrderedMsgChain_1 = __importStar(require("./OrderedMsgChain"));
class OrderingUtil extends OrderedMsgChain_1.MsgChainEmitter {
    constructor(inOrderHandler, gapHandler, propagationTimeout, resendTimeout, maxGapRequests) {
        super();
        this.inOrderHandler = inOrderHandler;
        this.gapHandler = gapHandler;
        this.propagationTimeout = propagationTimeout;
        this.resendTimeout = resendTimeout;
        this.maxGapRequests = maxGapRequests;
        this.orderedChains = {};
    }
    add(unorderedStreamMessage) {
        const chain = this.getChain(unorderedStreamMessage.getPublisherId(), unorderedStreamMessage.getMsgChainId());
        chain.add(unorderedStreamMessage);
    }
    getChain(publisherId, msgChainId) {
        const key = publisherId + msgChainId;
        if (!this.orderedChains[key]) {
            const chain = new OrderedMsgChain_1.default(publisherId, msgChainId, this.inOrderHandler, this.gapHandler, this.propagationTimeout, this.resendTimeout, this.maxGapRequests);
            chain.on('error', (...args) => this.emit('error', ...args));
            chain.on('skip', (...args) => this.emit('skip', ...args));
            chain.on('drain', (...args) => this.emit('drain', ...args));
            this.orderedChains[key] = chain;
        }
        return this.orderedChains[key];
    }
    markMessageExplicitly(streamMessage) {
        const chain = this.getChain(streamMessage.getPublisherId(), streamMessage.getMsgChainId());
        chain.markMessageExplicitly(streamMessage);
    }
    isEmpty() {
        return Object.values(this.orderedChains).every((chain) => (chain.isEmpty()));
    }
    clearGaps() {
        Object.values(this.orderedChains).forEach((chain) => {
            chain.clearGap();
        });
    }
    disable() {
        this.maxGapRequests = 0;
        Object.values(this.orderedChains).forEach((chain) => {
            chain.disable();
        });
    }
}
exports.default = OrderingUtil;
//# sourceMappingURL=OrderingUtil.js.map