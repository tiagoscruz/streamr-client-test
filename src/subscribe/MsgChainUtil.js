"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MsgChainUtil = void 0;
const Gate_1 = require("./../utils/Gate");
const PushBuffer_1 = require("./../utils/PushBuffer");
class MsgChainProcessor {
    constructor(outputBuffer, processMessageFn, onError) {
        this.busy = new Gate_1.Gate();
        this.inputBuffer = [];
        this.outputBuffer = outputBuffer;
        this.processMessageFn = processMessageFn;
        this.onError = onError;
    }
    async addMessage(message) {
        this.inputBuffer.push(message);
        if (this.busy.isOpen()) {
            this.busy.close();
            while (this.inputBuffer.length > 0) {
                const nextMessage = this.inputBuffer.shift();
                try {
                    const processedMessage = await this.processMessageFn(nextMessage);
                    this.outputBuffer.push(processedMessage);
                }
                catch (e) {
                    this.onError.trigger(e);
                }
            }
            this.busy.open();
        }
    }
}
class MsgChainUtil {
    constructor(processMessageFn, onError) {
        this.outputBuffer = new PushBuffer_1.PushBuffer();
        this.processors = new Map();
        this.processMessageFn = processMessageFn;
        this.onError = onError;
    }
    addMessage(message) {
        const id = `${message.getPublisherId()}-${message.getMsgChainId()}`;
        let processor = this.processors.get(id);
        if (processor === undefined) {
            processor = new MsgChainProcessor(this.outputBuffer, this.processMessageFn, this.onError);
            this.processors.set(id, processor);
        }
        processor.addMessage(message); // add a task, but don't wait for it to complete
    }
    async flush() {
        await Promise.all(Array.from(this.processors.values()).map((p) => p.busy.check()));
    }
    stop() {
        this.outputBuffer.endWrite();
    }
    [Symbol.asyncIterator]() {
        return this.outputBuffer;
    }
}
exports.MsgChainUtil = MsgChainUtil;
//# sourceMappingURL=MsgChainUtil.js.map