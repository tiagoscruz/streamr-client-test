"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebStreamToNodeStream = void 0;
const stream_1 = require("stream");
const events_1 = require("events");
const ignoreAbort = (err) => {
    if (err.name === 'AbortError') {
        // ignore AbortError
        return;
    }
    throw err;
};
/**
 * Write to stream.
 * Block until drained or aborted
 */
async function write(stream, data, ac) {
    if (stream.write(data)) {
        return;
    }
    await (0, events_1.once)(stream, 'drain', ac);
}
/**
 * Background async task to pull data from the browser stream and push it into the node stream.
 */
async function pull(fromBrowserStream, toNodeStream) {
    const reader = fromBrowserStream.getReader();
    /* eslint-disable no-constant-condition */
    const ac = new AbortController();
    const cleanup = () => {
        ac.abort();
    };
    reader.closed.finally(() => {
        toNodeStream.off('close', cleanup);
    });
    // toNodeStream.once('error', cleanup)
    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) {
                return;
            }
            if (!toNodeStream.writable) {
                return;
            }
            await write(toNodeStream, value, ac);
        }
    }
    catch (err) {
        toNodeStream.destroy(err);
        reader.cancel();
        ac.abort();
    }
    finally {
        reader.cancel();
        toNodeStream.end();
    }
    /* eslint-enable no-constant-condition, no-await-in-loop */
}
/**
 * Convert browser ReadableStream to Node stream.Readable.
 */
function WebStreamToNodeStream(webStream, nodeStreamOptions) {
    if ('pipe' in webStream) {
        return webStream;
    }
    // use PassThrough so we can write to it
    const nodeStream = new stream_1.PassThrough(nodeStreamOptions);
    pull(webStream, nodeStream).catch(ignoreAbort);
    return nodeStream;
}
exports.WebStreamToNodeStream = WebStreamToNodeStream;
//# sourceMappingURL=WebStreamToNodeStream.js.map