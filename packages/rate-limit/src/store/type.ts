import type { IncrementResponse, Options } from '../type';

/**
 * An interface that all stores must implement.
 */
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
     * Method to decrement a client's hit counter.
     *
     * @param key {string} - The identifier for a client.
     */
    decrement: (key: string) => Promise<void> | void

    /**
     * Method to reset a client's hit counter.
     *
     * @param key {string} - The identifier for a client.
     */
    reset: (key: string) => Promise<void> | void
}
