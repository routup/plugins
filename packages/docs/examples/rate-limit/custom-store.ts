import { App, defineCoreHandler } from 'routup';
import type { IncrementResponse, Options, Store } from '@routup/rate-limit';
import { calculateNextResetTime, rateLimit } from '@routup/rate-limit';

type Entry = {
    hits: number;
    resetTime: Date;
};

/**
 * Gives every client its own window, starting with its first request.
 */
export class PerClientStore implements Store {
    windowMs = 60_000;

    entries = new Map<string, Entry>();

    init(options: Options) {
        this.windowMs = options.windowMs;
    }

    increment(key: string): IncrementResponse {
        let entry = this.entries.get(key);

        if (!entry || entry.resetTime.getTime() <= Date.now()) {
            entry = { hits: 0, resetTime: calculateNextResetTime(this.windowMs) };
            this.entries.set(key, entry);
        }

        entry.hits += 1;

        return { totalHits: entry.hits, resetTime: entry.resetTime };
    }

    decrement(key: string) {
        const entry = this.entries.get(key);

        if (entry && entry.hits > 0) {
            entry.hits -= 1;
        }
    }

    reset(key: string) {
        this.entries.delete(key);
    }
}

export const store = new PerClientStore();

export const app = new App();

app.use(rateLimit({
    windowMs: 60_000,
    max: 2,
    store,
}));

app.get('/', defineCoreHandler(() => 'Hello, World!'));
