"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpUtil = exports.NotFoundError = exports.ValidationError = exports.HttpError = exports.DEFAULT_HEADERS = exports.ErrorCode = void 0;
const node_fetch_1 = __importDefault(require("node-fetch"));
const utils_1 = require("./utils/utils");
const WebStreamToNodeStream_1 = require("./utils/WebStreamToNodeStream");
const split2_1 = __importDefault(require("split2"));
const protocol_1 = require("@streamr/protocol");
const tsyringe_1 = require("tsyringe");
const LoggerFactory_1 = require("./utils/LoggerFactory");
var ErrorCode;
(function (ErrorCode) {
    ErrorCode["NOT_FOUND"] = "NOT_FOUND";
    ErrorCode["VALIDATION_ERROR"] = "VALIDATION_ERROR";
    ErrorCode["UNKNOWN"] = "UNKNOWN";
})(ErrorCode = exports.ErrorCode || (exports.ErrorCode = {}));
exports.DEFAULT_HEADERS = {
    'Streamr-Client': `streamr-client-javascript/${(0, utils_1.getVersionString)()}`,
};
class HttpError extends Error {
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    constructor(message, response, body, errorCode) {
        const typePrefix = errorCode ? errorCode + ': ' : '';
        // add leading space if there is a body set
        super(typePrefix + message);
        this.response = response;
        this.body = body;
        this.code = errorCode || ErrorCode.UNKNOWN;
        this.errorCode = this.code;
    }
}
exports.HttpError = HttpError;
class ValidationError extends HttpError {
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    constructor(message, response, body) {
        super(message, response, body, ErrorCode.VALIDATION_ERROR);
    }
}
exports.ValidationError = ValidationError;
class NotFoundError extends HttpError {
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    constructor(message, response, body) {
        super(message, response, body, ErrorCode.NOT_FOUND);
    }
}
exports.NotFoundError = NotFoundError;
const ERROR_TYPES = new Map();
ERROR_TYPES.set(ErrorCode.VALIDATION_ERROR, ValidationError);
ERROR_TYPES.set(ErrorCode.NOT_FOUND, NotFoundError);
ERROR_TYPES.set(ErrorCode.UNKNOWN, HttpError);
const parseErrorCode = (body) => {
    let json;
    try {
        json = JSON.parse(body);
    }
    catch (err) {
        return ErrorCode.UNKNOWN;
    }
    const { code } = json;
    return code in ErrorCode ? code : ErrorCode.UNKNOWN;
};
let HttpUtil = class HttpUtil {
    constructor(loggerFactory) {
        this.logger = loggerFactory.createLogger(module);
    }
    async *fetchHttpStream(url, abortController = new AbortController()) {
        const response = await fetchResponse(url, this.logger, {
            signal: abortController.signal
        });
        if (!response.body) {
            throw new Error('No Response Body');
        }
        let stream;
        try {
            // in the browser, response.body will be a web stream. Convert this into a node stream.
            const source = (0, WebStreamToNodeStream_1.WebStreamToNodeStream)(response.body);
            stream = source.pipe((0, split2_1.default)((message) => {
                return protocol_1.StreamMessage.deserialize(message);
            }));
            stream.once('close', () => {
                abortController.abort();
            });
            yield* stream;
        }
        catch (err) {
            abortController.abort();
            throw err;
        }
        finally {
            stream?.destroy();
        }
    }
    // eslint-disable-next-line class-methods-use-this
    createQueryString(query) {
        const withoutEmpty = Object.fromEntries(Object.entries(query).filter(([_k, v]) => v != null));
        return new URLSearchParams(withoutEmpty).toString();
    }
};
HttpUtil = __decorate([
    (0, tsyringe_1.scoped)(tsyringe_1.Lifecycle.ContainerScoped),
    __param(0, (0, tsyringe_1.inject)(LoggerFactory_1.LoggerFactory)),
    __metadata("design:paramtypes", [LoggerFactory_1.LoggerFactory])
], HttpUtil);
exports.HttpUtil = HttpUtil;
async function fetchResponse(url, logger, opts, // eslint-disable-line @typescript-eslint/explicit-module-boundary-types
fetchFn = node_fetch_1.default) {
    const timeStart = Date.now();
    const options = {
        ...opts,
        headers: {
            ...exports.DEFAULT_HEADERS,
            ...(opts && opts.headers),
        },
    };
    // add default 'Content-Type: application/json' header for all POST and PUT requests
    if (!options.headers['Content-Type'] && (options.method === 'POST' || options.method === 'PUT')) {
        options.headers['Content-Type'] = 'application/json';
    }
    logger.debug('fetching %s with options %j', url, opts);
    const response = await fetchFn(url, opts);
    const timeEnd = Date.now();
    logger.debug('%s responded with %d %s %s in %d ms', url, response.status, response.statusText, timeEnd - timeStart);
    if (response.ok) {
        return response;
    }
    const body = await response.text();
    const errorCode = parseErrorCode(body);
    const ErrorClass = ERROR_TYPES.get(errorCode);
    throw new ErrorClass(`Request to ${url} returned with error code ${response.status}.`, response, body, errorCode);
}
//# sourceMappingURL=HttpUtil.js.map