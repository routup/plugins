import type { IncrementResponse, Options } from '../types';

/**
 * An interface that all stores must implement.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention -- public API name
export interface Store {
    /**
     * Method that initializes the store, and has access to the options passed to
     * the middleware too.
     *
     * @param options {Options} - The options used to setup the middleware.
     */
    init?: (options: Options) => void

    /**
     * Method to increment a client's hit counter.
     *
     * @param key {string} - The identifier for a client.
     *
     * @returns {IncrementResponse} - The number of hits and reset time for that client.
     */
    increment: (key: string) => Promise<IncrementResponse> | IncrementResponse

    /**
     * Method to read a client's hit counter without incrementing it.
     * Required by the `countAfterResponse` option.
     *
     * @param key {string} - The identifier for a client.
     *
     * @returns {IncrementResponse | undefined} - The number of hits and reset time
     * for that client, or `undefined` when the client has no hits.
     */
    get?: (key: string) => Promise<IncrementResponse | undefined> | IncrementResponse | undefined

    /**
     * Method to decrement a client's hit counter.
     *
     * @param key {string} - The identifier for a client.
     * @param window {unknown} - The `window` token `increment()` returned for the hit;
     * a store should ignore the decrement when that window has ended.
     */
    decrement: (key: string, window?: unknown) => Promise<void> | void

    /**
     * Method to reset a client's hit counter.
     *
     * @param key {string} - The identifier for a client.
     */
    reset: (key: string) => Promise<void> | void
}
