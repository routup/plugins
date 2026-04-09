import type { IRoutupEvent } from 'routup';
import type { Store } from './store';

/**
 * Request rate limit info record.
 */
export type RateLimitInfo = {
    limit: number
    current: number
    remaining: number
    resetTime?: Date
};

/**
 * Method to generate/retrieve a value based on the incoming event.
 *
 * @param event {IRoutupEvent} - The routup event.
 *
 * @returns T - The value needed.
 */
export type ValueDeterminingMiddleware<T> = (
    event: IRoutupEvent,
) => T | Promise<T>;

/**
 * Handler that sends back a response when a client is rate-limited.
 *
 * @param event {IRoutupEvent} - The routup event.
 * @param options {Options} - The options used to set up the middleware.
 */
export type RateLimitExceededEventHandler = (
    event: IRoutupEvent,
    options: Options,
) => unknown | Promise<unknown>;

/**
 * Data returned from the `Store` when a client's hit counter is incremented.
 */
export type IncrementResponse = {
    /**
     * The number of hits for that client so far.
     */
    totalHits: number
    /**
     * The time when the counter resets.
     */
    resetTime: Date | undefined
};

export type Options = {
    /**
     * How long we should remember the requests.
     *
     * Defaults to `60000` ms (= 1 minute).
     */
    windowMs: number

    /**
     * The maximum number of connections to allow during the `window` before
     * rate limiting the client.
     *
     * Can be the limit itself as a number or a function that receives
     * the event and returns the limit.
     *
     * Defaults to `5`.
     */
    max: number | ValueDeterminingMiddleware<number>

    /**
     * The response body to send back when a client is rate limited.
     *
     * Defaults to `'Too many requests, please try again later.'`
     */
    message: any | ValueDeterminingMiddleware<any>

    /**
     * The HTTP status code to send back when a client is rate limited.
     *
     * Defaults to `HTTP 429 Too Many Requests` (RFC 6585).
     */
    statusCode: number

    /**
     * If `true`, the library will (by default) skip all requests that have a 4XX
     * or 5XX status.
     *
     * Defaults to `false`.
     */
    skipFailedRequest: boolean

    /**
     * If `true`, the library will (by default) skip all requests that have a
     * status code less than 400.
     *
     * Defaults to `false`.
     */
    skipSuccessfulRequest: boolean

    /**
     * Method to generate custom identifiers for clients.
     *
     * By default, the client's IP address is used.
     */
    keyGenerator: ValueDeterminingMiddleware<string>

    /**
     * Handler that sends back a response when a client is
     * rate-limited.
     *
     * By default, sends back the `statusCode` and `message` set via the options.
     */
    handler: RateLimitExceededEventHandler

    /**
     * Method to determine whether or not this request
     * counts towards a client's quota.
     *
     * By default, skips no requests.
     */
    skip: ValueDeterminingMiddleware<boolean>

    /**
     * Method to determine whether the request counts as 'successful'. Used
     * when either `skipSuccessfulRequests` or `skipFailedRequests` is set to true.
     *
     * By default, requests with a response status code less than 400 are considered
     * successful.
     */
    requestWasSuccessful: (event: IRoutupEvent, response: Response) => boolean

    /**
     * The `Store` to use to store the hit count for each client.
     *
     * By default, the built-in `MemoryStore` will be used.
     */
    store: Store
};

export type OptionsInput = Partial<Options>;
