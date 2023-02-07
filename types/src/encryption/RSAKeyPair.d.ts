export declare class RSAKeyPair {
    private readonly privateKey;
    private readonly publicKey;
    private constructor();
    getPublicKey(): string;
    getPrivateKey(): string;
    static create(): Promise<RSAKeyPair>;
    private static create_serverEnvironment;
    private static create_browserEnvironment;
}
