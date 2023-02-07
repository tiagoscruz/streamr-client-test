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
exports.GraphQLClient = void 0;
const tsyringe_1 = require("tsyringe");
const Config_1 = require("../Config");
const HttpFetcher_1 = require("./HttpFetcher");
const LoggerFactory_1 = require("./LoggerFactory");
let GraphQLClient = class GraphQLClient {
    constructor(loggerFactory, httpFetcher, config) {
        this.httpFetcher = httpFetcher;
        this.config = config;
        this.logger = loggerFactory.createLogger(module);
    }
    async sendQuery(query) {
        this.logger.debug('GraphQL query: %s', query);
        const res = await this.httpFetcher.fetch(this.config.contracts.theGraphUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                accept: '*/*',
            },
            body: JSON.stringify(query)
        });
        const resText = await res.text();
        let resJson;
        try {
            resJson = JSON.parse(resText);
        }
        catch {
            throw new Error(`GraphQL query failed with "${resText}", check that your theGraphUrl="${this.config.contracts.theGraphUrl}" is correct`);
        }
        this.logger.debug('GraphQL response: %j', resJson);
        if (!resJson.data) {
            if (resJson.errors && resJson.errors.length > 0) {
                throw new Error('GraphQL query failed: ' + JSON.stringify(resJson.errors.map((e) => e.message)));
            }
            else {
                throw new Error('GraphQL query failed');
            }
        }
        return resJson.data;
    }
    async *fetchPaginatedResults(createQuery, 
    /*
     * For simple queries there is one root level property, e.g. "streams" or "permissions"
     * which contain array of items. If the query contains more than one root level property
     * or we want to return non-root elements as items, the caller must pass a custom
     * function to parse the items.
     */
    parseItems = (response) => {
        const rootKey = Object.keys(response)[0];
        return response[rootKey];
    }, pageSize = 1000) {
        let lastResultSet;
        do {
            const lastId = (lastResultSet !== undefined) ? lastResultSet[lastResultSet.length - 1].id : '';
            const query = createQuery(lastId, pageSize);
            const response = await this.sendQuery(query);
            const items = parseItems(response);
            yield* items;
            lastResultSet = items;
        } while (lastResultSet.length === pageSize);
    }
    async getIndexBlockNumber() {
        const response = await this.sendQuery({ query: '{ _meta { block { number } } }' });
        // eslint-disable-next-line no-underscore-dangle
        return response._meta.block.number;
    }
    static createWhereClause(variables) {
        const parameterList = Object.keys(variables)
            .filter((k) => variables[k] !== undefined)
            .map((k) => k + ': $' + k)
            .join(' ');
        return `where: { ${parameterList} }`;
    }
};
GraphQLClient = __decorate([
    (0, tsyringe_1.scoped)(tsyringe_1.Lifecycle.ContainerScoped),
    __param(0, (0, tsyringe_1.inject)(LoggerFactory_1.LoggerFactory)),
    __param(1, (0, tsyringe_1.inject)(HttpFetcher_1.HttpFetcher)),
    __param(2, (0, tsyringe_1.inject)(Config_1.ConfigInjectionToken)),
    __metadata("design:paramtypes", [LoggerFactory_1.LoggerFactory,
        HttpFetcher_1.HttpFetcher, Object])
], GraphQLClient);
exports.GraphQLClient = GraphQLClient;
//# sourceMappingURL=GraphQLClient.js.map