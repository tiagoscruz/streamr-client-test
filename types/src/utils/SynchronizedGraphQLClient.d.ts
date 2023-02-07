import { GraphQLClient, GraphQLQuery } from './GraphQLClient';
import { StrictStreamrClientConfig } from '../Config';
import { LoggerFactory } from './LoggerFactory';
export declare class SynchronizedGraphQLClient {
    private delegate;
    private requiredBlockNumber;
    private indexingState;
    constructor(loggerFactory: LoggerFactory, delegate: GraphQLClient, config: Pick<StrictStreamrClientConfig, '_timeouts'>);
    updateRequiredBlockNumber(blockNumber: number): void;
    sendQuery(query: GraphQLQuery): Promise<any>;
    fetchPaginatedResults<T extends {
        id: string;
    }>(createQuery: (lastId: string, pageSize: number) => GraphQLQuery, parseItems?: (response: any) => T[], pageSize?: number): AsyncGenerator<T, void, undefined>;
}
