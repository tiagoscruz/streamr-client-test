"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSubscribePipeline = void 0;
const OrderMessages_1 = require("./OrderMessages");
const MessageStream_1 = require("./MessageStream");
const Validator_1 = require("../Validator");
const Decrypt_1 = require("./Decrypt");
const MsgChainUtil_1 = require("./MsgChainUtil");
const createSubscribePipeline = (opts) => {
    const validate = new Validator_1.Validator(opts.streamRegistryCached);
    const gapFillMessages = new OrderMessages_1.OrderMessages(opts.config, opts.resends, opts.streamPartId, opts.loggerFactory);
    /* eslint-enable object-curly-newline */
    const onError = async (error, streamMessage) => {
        if (streamMessage) {
            ignoreMessages.add(streamMessage);
        }
        if (error && 'streamMessage' in error && error.streamMessage) {
            ignoreMessages.add(error.streamMessage);
        }
        throw error;
    };
    const decrypt = new Decrypt_1.Decrypt(opts.groupKeyStore, opts.subscriberKeyExchange, opts.streamRegistryCached, opts.destroySignal, opts.loggerFactory, opts.streamrClientEventEmitter, opts.config);
    const messageStream = new MessageStream_1.MessageStream();
    const msgChainUtil = new MsgChainUtil_1.MsgChainUtil(async (msg) => {
        await validate.validate(msg);
        return decrypt.decrypt(msg);
    }, messageStream.onError);
    // collect messages that fail validation/parsixng, do not push out of pipeline
    // NOTE: we let failed messages be processed and only removed at end so they don't
    // end up acting as gaps that we repeatedly try to fill.
    const ignoreMessages = new WeakSet();
    messageStream.onError.listen(onError);
    messageStream
        // order messages (fill gaps)
        .pipe(gapFillMessages.transform())
        // validate & decrypt
        .pipe(async function* (src) {
        setImmediate(async () => {
            for await (const msg of src) {
                msgChainUtil.addMessage(msg);
            }
            await msgChainUtil.flush();
            msgChainUtil.stop();
        });
        yield* msgChainUtil;
    })
        // parse content
        .forEach(async (streamMessage) => {
        streamMessage.getParsedContent();
    })
        // ignore any failed messages
        .filter(async (streamMessage) => {
        return !ignoreMessages.has(streamMessage);
    })
        .onBeforeFinally.listen(async () => {
        const tasks = [
            gapFillMessages.stop(),
            validate.stop(),
        ];
        await Promise.allSettled(tasks);
    });
    return messageStream;
};
exports.createSubscribePipeline = createSubscribePipeline;
//# sourceMappingURL=subscribePipeline.js.map