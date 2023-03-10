"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Scaffold = void 0;
const p_limit_1 = __importDefault(require("p-limit"));
const AggregatedError_1 = require("./AggregatedError");
const noop = () => { };
function Scaffold(
// eslint-disable-next-line @typescript-eslint/default-param-last
sequence = [], _checkFn, { id = '', onError, onDone, onChange } = {}) {
    let error;
    // ignore error if check fails
    const nextSteps = sequence.slice().reverse().map((fn) => (async () => {
        const downFn = await fn();
        return (typeof downFn === 'function'
            ? downFn
            : noop);
    }));
    const prevSteps = [];
    const onDownSteps = [];
    const queue = (0, p_limit_1.default)(1);
    let isDone = false;
    let didStart = false;
    function collectErrors(err) {
        try {
            if (typeof onError === 'function') {
                onError(err); // give option to suppress error
            }
            else {
                throw err; // rethrow
            }
        }
        catch (newErr) {
            error = AggregatedError_1.AggregatedError.from(error, newErr, `ScaffoldError:${id}`);
        }
    }
    const checkShouldUp = async () => {
        if (error) {
            return false;
        }
        try {
            return await _checkFn();
        }
        catch (err) {
            collectErrors(err);
        }
        return false;
    };
    let shouldUp = false;
    let prevShouldUp = false;
    const innerQueue = (0, p_limit_1.default)(1);
    async function nextScaffoldStep() {
        shouldUp = await checkShouldUp();
        const didChange = prevShouldUp !== shouldUp;
        prevShouldUp = shouldUp;
        if (didChange && typeof onChange === 'function') {
            try {
                await onChange(shouldUp);
            }
            catch (err) {
                collectErrors(err);
            }
            return nextScaffoldStep();
        }
        if (shouldUp) {
            if (nextSteps.length) {
                isDone = false;
                didStart = true;
                let onDownStep;
                const stepFn = nextSteps.pop();
                prevSteps.push(stepFn);
                try {
                    onDownStep = await stepFn();
                }
                catch (err) {
                    collectErrors(err);
                }
                onDownSteps.push(onDownStep || (() => { }));
                return await nextScaffoldStep(); // return await gives us a better stack trace
            }
        }
        else if (onDownSteps.length) {
            isDone = false;
            didStart = true;
            const stepFn = onDownSteps.pop(); // exists because checked onDownSteps.length
            try {
                await stepFn();
            }
            catch (err) {
                collectErrors(err);
            }
            nextSteps.push(prevSteps.pop());
            return await nextScaffoldStep(); // return await gives us a better stack trace
        }
        else if (error) {
            const err = error;
            error = undefined;
            isDone = true;
            throw err;
        }
        isDone = true;
        return Promise.resolve();
    }
    function isActive() {
        return !(didStart
            && isDone
            && !queue.activeCount
            && !queue.pendingCount);
    }
    const nextDone = async () => {
        await innerQueue(() => nextScaffoldStep());
    };
    let currentStep;
    const queuedNext = async () => {
        let stepErr;
        try {
            currentStep = queue(() => nextDone());
            await currentStep;
        }
        catch (err) {
            stepErr = err;
            throw err;
        }
        finally {
            if (!isActive()) {
                didStart = false;
                if (typeof onDone === 'function') {
                    const err = stepErr;
                    stepErr = undefined;
                    await onDone(shouldUp, err);
                }
            }
        }
    };
    return Object.assign(queuedNext, {
        next: nextDone,
        isActive,
        getCurrentStep() {
            return currentStep;
        },
        get activeCount() {
            return queue.activeCount;
        },
        get pendingCount() {
            return queue.pendingCount;
        },
        setError(err) {
            error = AggregatedError_1.AggregatedError.from(error, err);
        },
        getError() {
            return error;
        },
        clearError() {
            const err = error;
            error = undefined;
            return err;
        }
    });
}
exports.Scaffold = Scaffold;
//# sourceMappingURL=Scaffold.js.map