import type { Client } from 'redis-extension';
import { createClient } from 'redis-extension';
import type {
    IncrementResponse,
    Options,
    Store,
} from '@routup/rate-limit';
import {
    calculateNextResetTime,
} from '@routup/rate-limit';

export class RedisStore implements Store {
    options!: Options;

    client : Client;

    /**
     * @param input - A redis url for a dedicated client, or an existing client.
     * Without it, a client for localhost:6379 is created.
     */
    constructor(input?: string | Client) {
        if (typeof input === 'undefined') {
            this.client = createClient();
        } else if (typeof input === 'string') {
            this.client = createClient({ url: input });
        } else {
            this.client = input;
        }
    }

    /**
     * Method that initializes the store.
     *
     * @param options {Options} - The options used to setup the middleware.
     */
    init(options: Options) : void {
        this.options = options;
    }

    /**
     * Method to increment a client's hit counter.
     *
     * @param key {string} - The identifier for a client.
     *
     * @returns {IncrementResponse} - The number of hits and reset time for that client.
     *
     * @public
     */
    async increment(key: string) : Promise<IncrementResponse> {
        key = this.buildKey(key);

        const entry = await this.client.get(key);

        let totalHits : number;

        if (entry) {
            totalHits = Number.parseInt(entry, 10) + 1;
        } else {
            totalHits = 1;
        }

        await this.client.set(
            key,
            totalHits,
            'PX',
            this.options.windowMs,
        );

        const resetTime = calculateNextResetTime(this.options.windowMs);

        return {
            totalHits,
            resetTime,
        };
    }

    /**
     * Method to read a client's hit counter without incrementing it.
     *
     * @param key {string} - The identifier for a client.
     *
     * @returns {IncrementResponse | undefined} - The number of hits and reset time
     * for that client, or `undefined` when the key does not exist.
     *
     * @public
     */
    async get(key: string) : Promise<IncrementResponse | undefined> {
        key = this.buildKey(key);

        const entry = await this.client.get(key);

        if (!entry) {
            return undefined;
        }

        const ttl = await this.client.pttl(key);

        return {
            totalHits: Number.parseInt(entry, 10),
            resetTime: ttl >= 0 ?
                calculateNextResetTime(ttl) :
                undefined,
        };
    }

    /**
     * Method to decrement a client's hit counter.
     *
     * The window of a key ends when its TTL expires, which the stored
     * counter cannot tell apart from a key written again afterwards,
     * so the window token of the limiter is not checked.
     *
     * @param key {string} - The identifier for a client.
     *
     * @public
     */
    async decrement(key: string): Promise<void> {
        key = this.buildKey(key);

        const entry = await this.client.get(key);

        if (!entry) {
            return;
        }

        const totalHits = Number.parseInt(entry, 10) - 1;

        this.client.set(
            key,
            totalHits,
            'PX',
            this.options.windowMs,
        );
    }

    /**
     * Method to reset a client's hit counter.
     *
     * @param key {string} - The identifier for a client.
     *
     * @public
     */
    async reset(key: string) : Promise<void> {
        key = this.buildKey(key);

        await this.client.del(key);
    }

    /**
     * Method to build redis key.
     *
     * @param key
     * @protected
     */
    protected buildKey(key: string) {
        return `rate-limit:${key}`;
    }
}
