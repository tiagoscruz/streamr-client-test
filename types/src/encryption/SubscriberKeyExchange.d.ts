import { StreamPartID } from '@streamr/protocol';
import { Authentication } from '../Authentication';
import { StrictStreamrClientConfig } from '../Config';
import { NetworkNodeFacade } from '../NetworkNodeFacade';
import { Validator } from '../Validator';
import { GroupKeyStore } from './GroupKeyStore';
import { EthereumAddress } from '@streamr/utils';
import { LoggerFactory } from '../utils/LoggerFactory';
export declare class SubscriberKeyExchange {
    private readonly logger;
    private rsaKeyPair;
    private readonly networkNodeFacade;
    private readonly store;
    private readonly authentication;
    private readonly validator;
    private readonly pendingRequests;
    private readonly ensureStarted;
    requestGroupKey: (groupKeyId: string, publisherId: EthereumAddress, streamPartId: StreamPartID) => Promise<void>;
    constructor(networkNodeFacade: NetworkNodeFacade, store: GroupKeyStore, authentication: Authentication, validator: Validator, loggerFactory: LoggerFactory, config: Pick<StrictStreamrClientConfig, 'decryption'>);
    private doRequestGroupKey;
    private createRequest;
    private onMessage;
}
