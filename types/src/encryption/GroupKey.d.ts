export declare class GroupKeyError extends Error {
    groupKey?: GroupKey;
    constructor(message: string, groupKey?: GroupKey);
}
/**
 * GroupKeys are AES cipher keys, which are used to encrypt/decrypt StreamMessages (when encryptionType is AES).
 * Each group key contains 256 random bits of key data and an UUID.
 */
export declare class GroupKey {
    constructor(groupKeyId: string, data: Uint8Array);
    private static validate;
    static generate(id?: string): GroupKey;
}
