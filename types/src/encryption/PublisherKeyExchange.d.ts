import { Authentication } from '../Authentication';
import { NetworkNodeFacade } from '../NetworkNodeFacade';
import { Validator } from '../Validator';
import { GroupKeyStore } from './GroupKeyStore';
import { LoggerFactory } from '../utils/LoggerFactory';
export declare class PublisherKeyExchange {
    private readonly logger;
    private readonly store;
    private readonly networkNodeFacade;
    private readonly authentication;
    private readonly validator;
    constructor(store: GroupKeyStore, networkNodeFacade: NetworkNodeFacade, loggerFactory: LoggerFactory, authentication: Authentication, validator: Validator);
    private onMessage;
    private createResponse;
}
