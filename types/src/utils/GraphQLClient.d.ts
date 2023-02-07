import { StrictStreamrClientConfig } from '../Config';
import { HttpFetcher } from './HttpFetcher';
import { LoggerFactory } from './LoggerFactory';
export interface GraphQLQuery {
    query: string;
    variables?: Record<string, any>;
}
export declare class GraphQLClient {
    private httpFetcher;
    private config;
    private readonly logger;
    constructor(loggerFactory: LoggerFactory, httpFetcher: HttpFetcher, config: Pick<StrictStreamrClientConfig, 'contracts'>);
    sendQuery(query: GraphQLQuery): Promise<any>;
    fetchPaginatedResults<T extends {
        id: string;
    }>(createQuery: (lastId: string, pageSize: number) => GraphQLQuery, parseItems?: ((response: any) => T[]), pageSize?: number): AsyncGenerator<T, void, undefined>;
    getIndexBlockNumber(): Promise<number>;
    static createWhereClause(variables: Record<string, any>): string;
}
