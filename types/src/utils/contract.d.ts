import { Contract, ContractReceipt, ContractTransaction } from '@ethersproject/contracts';
import EventEmitter from 'eventemitter3';
import { LoggerFactory } from './LoggerFactory';
export interface ContractEvent {
    onMethodExecute: (methodName: string) => void;
    onTransactionSubmit: (methodName: string, tx: ContractTransaction) => void;
    onTransactionConfirm: (methodName: string, tx: ContractTransaction, receipt: ContractReceipt) => void;
}
export type ObservableContract<T extends Contract> = T & {
    eventEmitter: EventEmitter<ContractEvent>;
};
export declare function waitForTx(txToSubmit: Promise<ContractTransaction>): Promise<ContractReceipt>;
/**
 * Adds error handling, logging and limits concurrency.
 *
 * You can use the decorated contract normally, e.g.:
 *     const tx = await contract.createFoobar(123)
 *     return await tx.wait()
 * or
 *     await contract.getFoobar(456)
 */
export declare const createDecoratedContract: <T extends Contract>(contract: Contract, contractName: string, loggerFactory: LoggerFactory, maxConcurrentCalls: number) => ObservableContract<T>;
