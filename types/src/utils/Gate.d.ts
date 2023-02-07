export declare class Gate {
    isLocked: boolean;
    private pending?;
    /**
     * Opens gate.
     * Pending check calls will resolve true.
     * Future check calls will resolve true, until close or lock called.
     */
    open(): void;
    /**
     * Stops gate opening or closing. Pending and future calls will resolve false.
     */
    lock(): void;
    /**
     * Opens gate but resolves pending with an error.
     * TODO: remove? might not be needed.
     */
    error(err: Error): void;
    /**
     * Closes gate.
     * Noop if already closed.
     * Future check calls will block, until open or lock called.
     */
    close(): void;
    /**
     * Calls open/close based on shouldBeOpen parameter.
     * Convenience.
     */
    setOpenState(shouldBeOpen: boolean): void;
    /**
     * @returns True iff gate is open. False if locked or closed.
     */
    isOpen(): boolean;
    private clearPending;
    /**
     * @returns Promise<true> iff opened successfully
     */
    check(): Promise<boolean>;
}
