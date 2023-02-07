import { StreamID } from '@streamr/protocol';
import { StrictStreamrClientConfig } from '../Config';
import { StreamRegistry } from './StreamRegistry';
import { Stream } from '../Stream';
import { EthereumAddress } from '@streamr/utils';
import { LoggerFactory } from '../utils/LoggerFactory';
export declare class StreamRegistryCached {
    private streamRegistry;
    private readonly logger;
    private readonly _getStream;
    private readonly _isStreamPublisher;
    private readonly _isStreamSubscriber;
    private readonly _isPublic;
    constructor(loggerFactory: LoggerFactory, streamRegistry: StreamRegistry, config: Pick<StrictStreamrClientConfig, 'cache'>);
    getStream(streamId: StreamID): Promise<Stream>;
    isStreamPublisher(streamId: StreamID, ethAddress: EthereumAddress): Promise<boolean>;
    isStreamSubscriber(streamId: StreamID, ethAddress: EthereumAddress): Promise<boolean>;
    isPublic(streamId: StreamID): Promise<boolean>;
    /**
     * Clear cache for streamId
     */
    clearStream(streamId: StreamID): void;
}
