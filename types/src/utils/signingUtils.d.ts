/// <reference types="node" />
import { EthereumAddress } from '@streamr/utils';
export declare function sign(payload: string, privateKey: string): string;
export declare function recover(signature: string, payload: string, publicKeyBuffer?: Buffer | Uint8Array | undefined): string;
export declare function verify(address: EthereumAddress, payload: string, signature: string): boolean;
