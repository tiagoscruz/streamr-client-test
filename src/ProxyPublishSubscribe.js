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
exports.ProxyPublishSubscribe = void 0;
const StreamIDBuilder_1 = require("./StreamIDBuilder");
const tsyringe_1 = require("tsyringe");
const NetworkNodeFacade_1 = require("./NetworkNodeFacade");
let ProxyPublishSubscribe = class ProxyPublishSubscribe {
    constructor(node, streamIdBuilder) {
        this.node = node;
        this.streamIdBuilder = streamIdBuilder;
    }
    async openProxyConnections(streamDefinition, nodeIds, direction) {
        const streamPartId = await this.streamIdBuilder.toStreamPartID(streamDefinition);
        await Promise.allSettled(nodeIds.map((nodeId) => this.node.openProxyConnection(streamPartId, nodeId, direction)));
    }
    async closeProxyConnections(streamDefinition, nodeIds, direction) {
        const streamPartId = await this.streamIdBuilder.toStreamPartID(streamDefinition);
        await Promise.allSettled(nodeIds.map(async (nodeId) => this.node.closeProxyConnection(streamPartId, nodeId, direction)));
    }
};
ProxyPublishSubscribe = __decorate([
    (0, tsyringe_1.scoped)(tsyringe_1.Lifecycle.ContainerScoped),
    __param(1, (0, tsyringe_1.inject)(StreamIDBuilder_1.StreamIDBuilder)),
    __metadata("design:paramtypes", [NetworkNodeFacade_1.NetworkNodeFacade,
        StreamIDBuilder_1.StreamIDBuilder])
], ProxyPublishSubscribe);
exports.ProxyPublishSubscribe = ProxyPublishSubscribe;
//# sourceMappingURL=ProxyPublishSubscribe.js.map