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
exports.ContractFactory = void 0;
const tsyringe_1 = require("tsyringe");
const contracts_1 = require("@ethersproject/contracts");
const contract_1 = require("./utils/contract");
const SynchronizedGraphQLClient_1 = require("./utils/SynchronizedGraphQLClient");
const Config_1 = require("./Config");
const LoggerFactory_1 = require("./utils/LoggerFactory");
let ContractFactory = class ContractFactory {
    constructor(graphQLClient, loggerFactory, config) {
        this.graphQLClient = graphQLClient;
        this.loggerFactory = loggerFactory;
        this.config = config;
    }
    createReadContract(address, contractInterface, provider, name) {
        return (0, contract_1.createDecoratedContract)(new contracts_1.Contract(address, contractInterface, provider), name, this.loggerFactory, this.config.contracts.maxConcurrentCalls);
    }
    createWriteContract(address, contractInterface, signer, name) {
        const contract = (0, contract_1.createDecoratedContract)(new contracts_1.Contract(address, contractInterface, signer), name, this.loggerFactory, 
        // The current maxConcurrentCalls value is just a placeholder as we don't support concurrent writes (as we don't use nonces).
        // When we add the support, we should use the maxConcurrentCalls option from client config here.
        // Also note that if we'd use a limit of 1, it wouldn't make the concurrent transactions to a sequence of transactions,
        // because the concurrency limit covers only submits, not tx.wait() calls.
        999999);
        contract.eventEmitter.on('onTransactionConfirm', (_methodName, _tx, receipt) => {
            this.graphQLClient.updateRequiredBlockNumber(receipt.blockNumber);
        });
        return contract;
    }
};
ContractFactory = __decorate([
    (0, tsyringe_1.scoped)(tsyringe_1.Lifecycle.ContainerScoped),
    __param(1, (0, tsyringe_1.inject)(LoggerFactory_1.LoggerFactory)),
    __param(2, (0, tsyringe_1.inject)(Config_1.ConfigInjectionToken)),
    __metadata("design:paramtypes", [SynchronizedGraphQLClient_1.SynchronizedGraphQLClient,
        LoggerFactory_1.LoggerFactory, Object])
], ContractFactory);
exports.ContractFactory = ContractFactory;
//# sourceMappingURL=ContractFactory.js.map