"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchStreams = void 0;
/* eslint-disable padding-line-between-statements */
const protocol_1 = require("@streamr/protocol");
const permission_1 = require("../permission");
const GraphQLClient_1 = require("../utils/GraphQLClient");
const GeneratorUtils_1 = require("../utils/GeneratorUtils");
const utils_1 = require("@streamr/utils");
const searchStreams = (term, permissionFilter, graphQLClient, parseStream, logger) => {
    if ((term === undefined) && (permissionFilter === undefined)) {
        throw new Error('Requires a search term or a permission filter');
    }
    logger.debug('search streams with term="%s" and permissions=%j', term, permissionFilter);
    return (0, GeneratorUtils_1.map)(fetchSearchStreamsResultFromTheGraph(term, permissionFilter, graphQLClient), (item) => parseStream((0, protocol_1.toStreamID)(item.stream.id), item.stream.metadata), (err, item) => {
        logger.debug('omitting stream %s from result, reason: %s', item.stream.id, err.message);
    });
};
exports.searchStreams = searchStreams;
async function* fetchSearchStreamsResultFromTheGraph(term, permissionFilter, graphQLClient) {
    const backendResults = graphQLClient.fetchPaginatedResults((lastId, pageSize) => buildQuery(term, permissionFilter, lastId, pageSize));
    /*
     * There can be orphaned permission entities if a stream is deleted (currently
     * we don't remove the assigned permissions, see ETH-222)
     * TODO remove the filtering when ETH-222 has been implemented
     */
    const withoutOrphaned = (0, GeneratorUtils_1.filter)(backendResults, (p) => p.stream !== null);
    /*
     * As we query via permissions entity, any stream can appear multiple times (once per
     * permission user) if we don't do have exactly one userAddress in the GraphQL query.
     * That is the case if no permission filter is defined at all, or if permission.allowPublic
     * is true (then it appears twice: once for the user, and once for the public address).
     */
    const withoutDuplicates = (0, GeneratorUtils_1.unique)(withoutOrphaned, (p) => p.stream.id);
    if (permissionFilter !== undefined) {
        /*
         * There are situations where the The Graph may contain empty assignments (all boolean flags false,
         * and all expirations in the past). E.g.:
         * - if we granted some permissions to a user, but then removed all those permissions
         * - if we granted an expirable permission (subscribe or publish), and it has now expired
         * We don't want to return empty assignments to the user, because from user's perspective those are
         * non-existing assignments.
         * -> Here we filter out the empty assignments by defining a fallback value for anyOf filter
         */
        const anyOf = permissionFilter.anyOf ?? Object.values(permission_1.StreamPermission);
        yield* (0, GeneratorUtils_1.filter)(withoutDuplicates, (item) => {
            const actual = (0, permission_1.convertChainPermissionsToStreamPermissions)(item);
            return anyOf.some((p) => actual.includes(p));
        });
    }
    else {
        yield* withoutDuplicates;
    }
}
/*
 * Note that we query the results via permissions entity even if there is no permission filter
 * defined. It is maybe possible to optimize the non-permission related queries by searching over
 * the Stream entity. To support that we'd need to add a new field to The Graph (e.g. "idAsString"),
 * as we can't do substring filtering by Stream id field (there is no "id_contains" because
 * ID type is not a string)
 */
const buildQuery = (term, permissionFilter, lastId, pageSize) => {
    const variables = {
        stream_contains: term,
        id_gt: lastId
    };
    if (permissionFilter !== undefined) {
        variables.userAddress_in = [(0, utils_1.toEthereumAddress)(permissionFilter.user)];
        if (permissionFilter.allowPublic) {
            variables.userAddress_in.push(permission_1.PUBLIC_PERMISSION_ADDRESS);
        }
        if (permissionFilter.allOf !== undefined) {
            const now = String(Math.round(Date.now() / 1000));
            variables.canEdit = permissionFilter.allOf.includes(permission_1.StreamPermission.EDIT) ? true : undefined;
            variables.canDelete = permissionFilter.allOf.includes(permission_1.StreamPermission.DELETE) ? true : undefined;
            variables.publishExpiration_gt = permissionFilter.allOf.includes(permission_1.StreamPermission.PUBLISH) ? now : undefined;
            variables.subscribeExpiration_gt = permissionFilter.allOf.includes(permission_1.StreamPermission.SUBSCRIBE) ? now : undefined;
            variables.canGrant = permissionFilter.allOf.includes(permission_1.StreamPermission.GRANT) ? true : undefined;
        }
    }
    const query = `
        query (
            $stream_contains: String,
            $userAddress_in: [Bytes!]
            $canEdit: Boolean
            $canDelete: Boolean
            $publishExpiration_gt: BigInt
            $subscribeExpiration_gt: BigInt
            $canGrant: Boolean
            $id_gt: String
        ) {
            permissions (first: ${pageSize} orderBy: "id" ${GraphQLClient_1.GraphQLClient.createWhereClause(variables)}) {
                id
                stream {
                    id
                    metadata
                }
                userAddress
                canEdit
                canDelete
                publishExpiration
                subscribeExpiration
                canGrant
            }
        }`;
    return { query, variables };
};
//# sourceMappingURL=searchStreams.js.map