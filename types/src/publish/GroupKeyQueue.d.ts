import { StreamID } from '@streamr/protocol';
import { GroupKey } from '../encryption/GroupKey';
import { GroupKeyStore } from '../encryption/GroupKeyStore';
export interface GroupKeySequence {
    current: GroupKey;
    next?: GroupKey;
}
export declare class GroupKeyQueue {
    private currentGroupKey;
    private queuedGroupKey;
    private readonly streamId;
    private readonly store;
    constructor(streamId: StreamID, store: GroupKeyStore);
    useGroupKey(): Promise<GroupKeySequence>;
    rotate(newKey?: GroupKey): Promise<GroupKey>;
    rekey(newKey?: GroupKey): Promise<GroupKey>;
}
