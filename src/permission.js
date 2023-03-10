"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertStreamPermissionsToChainPermission = exports.convertChainPermissionsToStreamPermissions = exports.streamPermissionToSolidityType = exports.isPublicPermissionAssignment = exports.isPublicPermissionQuery = exports.PUBLIC_PERMISSION_ADDRESS = exports.StreamPermission = void 0;
const constants_1 = require("@ethersproject/constants");
const bignumber_1 = require("@ethersproject/bignumber");
var StreamPermission;
(function (StreamPermission) {
    StreamPermission["EDIT"] = "edit";
    StreamPermission["DELETE"] = "delete";
    StreamPermission["PUBLISH"] = "publish";
    StreamPermission["SUBSCRIBE"] = "subscribe";
    StreamPermission["GRANT"] = "grant";
})(StreamPermission = exports.StreamPermission || (exports.StreamPermission = {}));
exports.PUBLIC_PERMISSION_ADDRESS = '0x0000000000000000000000000000000000000000';
const isPublicPermissionQuery = (query) => {
    return query.public === true;
};
exports.isPublicPermissionQuery = isPublicPermissionQuery;
const isPublicPermissionAssignment = (query) => {
    return query.public === true;
};
exports.isPublicPermissionAssignment = isPublicPermissionAssignment;
const streamPermissionToSolidityType = (permission) => {
    switch (permission) {
        case StreamPermission.EDIT:
            return bignumber_1.BigNumber.from(0);
        case StreamPermission.DELETE:
            return bignumber_1.BigNumber.from(1);
        case StreamPermission.PUBLISH:
            return bignumber_1.BigNumber.from(2);
        case StreamPermission.SUBSCRIBE:
            return bignumber_1.BigNumber.from(3);
        case StreamPermission.GRANT:
            return bignumber_1.BigNumber.from(4);
        default:
            break;
    }
    return bignumber_1.BigNumber.from(0);
};
exports.streamPermissionToSolidityType = streamPermissionToSolidityType;
const convertChainPermissionsToStreamPermissions = (chainPermissions) => {
    const now = Math.round(Date.now() / 1000);
    const permissions = [];
    if (chainPermissions.canEdit) {
        permissions.push(StreamPermission.EDIT);
    }
    if (chainPermissions.canDelete) {
        permissions.push(StreamPermission.DELETE);
    }
    if (bignumber_1.BigNumber.from(chainPermissions.publishExpiration).gt(now)) {
        permissions.push(StreamPermission.PUBLISH);
    }
    if (bignumber_1.BigNumber.from(chainPermissions.subscribeExpiration).gt(now)) {
        permissions.push(StreamPermission.SUBSCRIBE);
    }
    if (chainPermissions.canGrant) {
        permissions.push(StreamPermission.GRANT);
    }
    return permissions;
};
exports.convertChainPermissionsToStreamPermissions = convertChainPermissionsToStreamPermissions;
const convertStreamPermissionsToChainPermission = (permissions) => {
    return {
        canEdit: permissions.includes(StreamPermission.EDIT),
        canDelete: permissions.includes(StreamPermission.DELETE),
        publishExpiration: permissions.includes(StreamPermission.PUBLISH) ? constants_1.MaxInt256 : bignumber_1.BigNumber.from(0),
        subscribeExpiration: permissions.includes(StreamPermission.SUBSCRIBE) ? constants_1.MaxInt256 : bignumber_1.BigNumber.from(0),
        canGrant: permissions.includes(StreamPermission.GRANT)
    };
};
exports.convertStreamPermissionsToChainPermission = convertStreamPermissionsToChainPermission;
//# sourceMappingURL=permission.js.map