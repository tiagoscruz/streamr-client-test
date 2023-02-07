import { MaybeAsync } from '../types';
/**
 * Takes a sequence of async steps & a check function.
 * While check function is true, will execute steps in order until all done.
 * Each step optionally returns a cleanup function.
 * If/when check fails (or there's an error) cleanup functions will be executed in order.
 * onChange fires when up/down direction changes.
 * onDone fires when no more up/down steps to execute.
 * onError fires when something errors. Rethrow in onError to keep error, don't rethrow to suppress.
 * returns a function which should be called whenever something changes that could affect the check.
 */
type Step = StepUp | MaybeAsync<() => void>;
type StepUp = MaybeAsync<() => StepDown>;
type StepDown = MaybeAsync<() => void>;
interface ScaffoldOptions {
    onError?: (error: Error) => void;
    onDone?: MaybeAsync<(shouldUp: boolean, error?: Error) => void>;
    onChange?: MaybeAsync<(shouldUp: boolean) => void>;
    id?: string;
}
type ScaffoldReturnType = (() => Promise<void>) & {
    readonly activeCount: number;
    readonly pendingCount: number;
    next: () => Promise<void>;
    isActive: () => boolean;
    getCurrentStep(): Promise<void>;
    setError(err: Error): void;
    getError(): Error | undefined;
    clearError(): Error | undefined;
};
export declare function Scaffold(sequence: Step[] | undefined, _checkFn: (() => Promise<boolean>) | (() => boolean), { id, onError, onDone, onChange }?: ScaffoldOptions): ScaffoldReturnType;
export {};
