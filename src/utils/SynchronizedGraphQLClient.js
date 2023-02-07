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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SynchronizedGraphQLClient = void 0;
const tsyringe_1 = require("tsyringe");
const GraphQLClient_1 = require("./GraphQLClient");
const Config_1 = require("../Config");
const Gate_1 = require("./Gate");
const utils_1 = require("@streamr/utils");
const utils_2 = require("@streamr/utils");
const LoggerFactory_1 = require("./LoggerFactory");
/*
 * SynchronizedGraphQLClient is used to query The Graph index. It is very similar to the
 * GraphQLClient class and has identical public API for executing queries.
 *
 * In this class there is an additional method `updateRequiredBlockNumber(n)`. If that method
 * is called, then any subsequent query will provide up-to-date data from The Graph (i.e. data
 * which has been indexed at least to that block number).
 *
 * If SynchronizedGraphQLClient is used, the client instance should be notified about any
 * transaction which writes to the blockchain indexed by The Graph. That way we can ensure that all
 * read queries from The Graph correspond the data written in those transactions.
 *
 * The notification can be done by calling the `updateRequiredBlockNumber(n)` method described above.
 * We can use the helper method `createWriteContract` to create a contract which automatically
 * updates the client when something is written to the blockchain via that contract.
 */
class BlockNumberGate extends Gate_1.Gate {
    constructor(blockNumber) {
        super();
        this.blockNumber = blockNumber;
    }
}
class IndexingState {
    constructor(getCurrentBlockNumber, pollTimeout, pollRetryInterval, loggerFactory) {
        this.blockNumber = 0;
        this.gates = new Set();
        this.getCurrentBlockNumber = getCurrentBlockNumber;
        this.pollTimeout = pollTimeout;
        this.pollRetryInterval = pollRetryInterval;
        this.logger = loggerFactory.createLogger(module);
    }
    async waitUntilIndexed(blockNumber) {
        this.logger.debug('waiting until The Graph is synchronized to block %d', blockNumber);
        const gate = this.getOrCreateGate(blockNumber);
        try {
            await (0, utils_1.withTimeout)(gate.check(), this.pollTimeout, `The Graph did not synchronize to block ${blockNumber}`);
        }
        catch (e) {
            if (e instanceof utils_1.TimeoutError) {
                this.gates.delete(gate);
            }
            throw e;
        }
    }
    getOrCreateGate(blockNumber) {
        const gate = new BlockNumberGate(blockNumber);
        if (blockNumber > this.blockNumber) {
            const isPolling = this.gates.size > 0;
            gate.close();
            this.gates.add(gate);
            if (!isPolling) {
                this.startPolling();
            }
        }
        return gate;
    }
    async startPolling() {
        this.logger.trace('start polling');
        while (this.gates.size > 0) {
            const newBlockNumber = await this.getCurrentBlockNumber();
            if (newBlockNumber !== this.blockNumber) {
                this.blockNumber = newBlockNumber;
                this.logger.trace('poll result is blockNumber=%d', this.blockNumber);
                this.gates.forEach((gate) => {
                    if (gate.blockNumber <= this.blockNumber) {
                        gate.open();
                        this.gates.delete(gate);
                    }
                });
            }
            if (this.gates.size > 0) {
                await (0, utils_2.wait)(this.pollRetryInterval);
            }
        }
        this.logger.trace('stop polling');
    }
}
let SynchronizedGraphQLClient = class SynchronizedGraphQLClient {
    constructor(loggerFactory, delegate, config) {
        this.requiredBlockNumber = 0;
        this.delegate = delegate;
        this.indexingState = new IndexingState(() => this.delegate.getIndexBlockNumber(), 
        // eslint-disable-next-line no-underscore-dangle
        config._timeouts.theGraph.timeout, 
        // eslint-disable-next-line no-underscore-dangle
        config._timeouts.theGraph.retryInterval, loggerFactory);
    }
    updateRequiredBlockNumber(blockNumber) {
        this.requiredBlockNumber = Math.max(blockNumber, this.requiredBlockNumber);
    }
    async sendQuery(query) {
        await this.indexingState.waitUntilIndexed(this.requiredBlockNumber);
        return this.delegate.sendQuery(query);
    }
    async *fetchPaginatedResults(createQuery, parseItems, pageSize) {
        await this.indexingState.waitUntilIndexed(this.requiredBlockNumber);
        yield* this.delegate.fetchPaginatedResults(createQuery, parseItems, pageSize);
    }
};
SynchronizedGraphQLClient = __decorate([
    (0, tsyringe_1.scoped)(tsyringe_1.Lifecycle.ContainerScoped),
    __param(0, (0, tsyringe_1.inject)(LoggerFactory_1.LoggerFactory)),
    __param(1, (0, tsyringe_1.inject)(GraphQLClient_1.GraphQLClient)),
    __param(2, (0, tsyringe_1.inject)(Config_1.ConfigInjectionToken)),
    __metadata("design:paramtypes", [LoggerFactory_1.LoggerFactory,
        GraphQLClient_1.GraphQLClient, Object])
], SynchronizedGraphQLClient);
exports.SynchronizedGraphQLClient = SynchronizedGraphQLClient;
//# sourceMappingURL=SynchronizedGraphQLClient.js.map