export declare class Mapping<K extends (string | number)[], V> {
    private delegate;
    private valueFactory;
    constructor(valueFactory: (...args: K) => Promise<V>);
    get(...args: K): Promise<V>;
}
