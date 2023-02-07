import { Signal } from './utils/Signal';
/**
 * Listen to onDestroy to fire cleanup code on destroy.
 * Careful not to introduce memleaks.
 * Trigger this to destroy the client.
 */
export declare class DestroySignal {
    readonly onDestroy: Signal<[]>;
    readonly trigger: () => Promise<void>;
    readonly abortSignal: AbortSignal;
    constructor();
    destroy(): Promise<void>;
    assertNotDestroyed(): void;
    isDestroyed(): boolean;
}
