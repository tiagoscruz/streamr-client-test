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
exports.StreamIDBuilder = exports.DEFAULT_PARTITION = void 0;
const protocol_1 = require("@streamr/protocol");
const tsyringe_1 = require("tsyringe");
const Authentication_1 = require("./Authentication");
exports.DEFAULT_PARTITION = 0;
function pickStreamId(definition) {
    const obj = definition;
    if (obj.id !== undefined) {
        return obj.id;
    }
    else if (obj.stream !== undefined) {
        return obj.stream;
    }
    else if (obj.streamId !== undefined) {
        return obj.streamId;
    }
    else {
        throw new Error('streamDefinition: object must have property: "id", "stream", or "streamId"');
    }
}
function parseRawDefinition(definition) {
    if (typeof definition === 'string') {
        return protocol_1.StreamPartIDUtils.parseRawElements(definition);
    }
    else if (typeof definition === 'object') {
        return [pickStreamId(definition), definition.partition];
    }
    else {
        throw new Error('streamDefinition: must be of type string or object');
    }
}
let StreamIDBuilder = class StreamIDBuilder {
    constructor(authentication) {
        this.authentication = authentication;
    }
    async toStreamID(streamIdOrPath) {
        let address;
        if (protocol_1.StreamIDUtils.isPathOnlyFormat(streamIdOrPath)) {
            address = await this.authentication.getAddress();
        }
        return (0, protocol_1.toStreamID)(streamIdOrPath, address);
    }
    async toStreamPartID(definition) {
        const [streamId, streamPartition] = await this.toStreamPartElements(definition);
        return (0, protocol_1.toStreamPartID)(streamId, streamPartition ?? exports.DEFAULT_PARTITION);
    }
    async toStreamPartElements(definition) {
        const [streamId, streamPartition] = parseRawDefinition(definition);
        return [await this.toStreamID(streamId), streamPartition];
    }
    async match(definition, streamPartId) {
        const [targetStreamId, targetPartition] = await this.toStreamPartElements(definition);
        return targetStreamId === protocol_1.StreamPartIDUtils.getStreamID(streamPartId)
            && (targetPartition === undefined || targetPartition === protocol_1.StreamPartIDUtils.getStreamPartition(streamPartId));
    }
};
StreamIDBuilder = __decorate([
    (0, tsyringe_1.scoped)(tsyringe_1.Lifecycle.ContainerScoped),
    __param(0, (0, tsyringe_1.inject)(Authentication_1.AuthenticationInjectionToken)),
    __metadata("design:paramtypes", [Object])
], StreamIDBuilder);
exports.StreamIDBuilder = StreamIDBuilder;
//# sourceMappingURL=StreamIDBuilder.js.map