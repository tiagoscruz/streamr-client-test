import { StreamrClientEventEmitter } from './events';
import { DestroySignal } from './DestroySignal';
import { NetworkNodeFacade } from './NetworkNodeFacade';
import { Publisher } from './publish/Publisher';
import { StreamrClientConfig } from './Config';
export declare const DEFAULTS: {
    periods: {
        duration: number;
        streamId: string;
    }[];
    maxPublishDelay: number;
};
export declare class MetricsPublisher {
    private publisher;
    private node;
    private eventEmitter;
    private destroySignal;
    private config;
    constructor(publisher: Publisher, node: NetworkNodeFacade, eventEmitter: StreamrClientEventEmitter, destroySignal: DestroySignal, config: Pick<StreamrClientConfig, 'metrics' | 'auth'>);
    private publish;
}
