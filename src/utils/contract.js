"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDecoratedContract = exports.waitForTx = void 0;
const eventemitter3_1 = __importDefault(require("eventemitter3"));
const network_node_1 = require("@streamr/network-node");
const p_limit_1 = __importDefault(require("p-limit"));
async function waitForTx(txToSubmit) {
    const tx = await txToSubmit;
    return tx.wait();
}
exports.waitForTx = waitForTx;
const isTransaction = (returnValue) => {
    return (returnValue.wait !== undefined && (typeof returnValue.wait === 'function'));
};
const createLogger = (eventEmitter, loggerFactory) => {
    const logger = loggerFactory.createLogger(module);
    eventEmitter.on('onMethodExecute', (methodName) => {
        logger.debug('execute %s', methodName);
    });
    eventEmitter.on('onTransactionSubmit', (methodName, tx) => {
        logger.debug('transaction submitted { method=%s, tx=%s, to=%s, nonce=%d, gasLimit=%d, gasPrice=%d }', methodName, tx.hash, network_node_1.NameDirectory.getName(tx.to), tx.nonce, tx.gasLimit, tx.gasPrice);
    });
    eventEmitter.on('onTransactionConfirm', (methodName, tx, receipt) => {
        logger.debug('transaction confirmed { method=%s, tx=%s, block=%d, confirmations=%d, gasUsed=%d, events=%j }', methodName, tx.hash, receipt.blockNumber, receipt.confirmations, receipt.gasUsed, (receipt.events || []).map((e) => e.event));
    });
};
const withErrorHandling = async (execute, methodName) => {
    try {
        return await execute();
    }
    catch (e) {
        const wrappedError = new Error(`Error in contract call "${methodName}"`);
        // @ts-expect-error unknown property
        wrappedError.reason = e;
        throw wrappedError;
    }
};
const createWrappedContractMethod = (originalMethod, methodName, eventEmitter, concurrencyLimit) => {
    return async (...args) => {
        const returnValue = await withErrorHandling(() => concurrencyLimit(() => {
            eventEmitter.emit('onMethodExecute', methodName);
            return originalMethod(...args);
        }), methodName);
        if (isTransaction(returnValue)) {
            const tx = returnValue;
            const originalWaitMethod = tx.wait;
            tx.wait = async (confirmations) => {
                const receipt = await withErrorHandling(() => originalWaitMethod(confirmations), `${methodName}.wait`);
                eventEmitter.emit('onTransactionConfirm', methodName, tx, receipt);
                return receipt;
            };
            eventEmitter.emit('onTransactionSubmit', methodName, tx);
        }
        return returnValue;
    };
};
/**
 * Adds error handling, logging and limits concurrency.
 *
 * You can use the decorated contract normally, e.g.:
 *     const tx = await contract.createFoobar(123)
 *     return await tx.wait()
 * or
 *     await contract.getFoobar(456)
 */
const createDecoratedContract = (contract, contractName, loggerFactory, maxConcurrentCalls) => {
    const eventEmitter = new eventemitter3_1.default();
    const methods = {};
    const concurrencyLimit = (0, p_limit_1.default)(maxConcurrentCalls);
    /*
     * Wrap each contract function. We read the list of functions from contract.functions, but
     * actually delegate each method to contract[methodName]. Those methods are almost identical
     * to contract.functions[methodName] methods. The major difference is the way of handling
     * single-value results: the return type of contract.functions[methodName] is always
     * Promise<Result> (see https://docs.ethers.io/v5/api/contract/contract/#Contract--readonly)
     */
    Object.keys(contract.functions).forEach((methodName) => {
        methods[methodName] = createWrappedContractMethod(contract[methodName], `${contractName}.${methodName}`, eventEmitter, concurrencyLimit);
    });
    createLogger(eventEmitter, loggerFactory);
    const result = {
        eventEmitter
    };
    // copy own properties and inherited properties (e.g. contract.removeAllListeners)
    for (const key in contract) {
        result[key] = methods[key] !== undefined ? methods[key] : contract[key];
    }
    return result;
};
exports.createDecoratedContract = createDecoratedContract;
//# sourceMappingURL=contract.js.map