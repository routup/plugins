import {
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';
import { App, defineCoreHandler } from 'routup';
import { rateLimit } from '@routup/rate-limit';
import { RedisStore } from '@routup/rate-limit-redis';
import { app as connectUrl } from '../../../examples/rate-limit-redis/connect-url';
import { app as keyPrefix } from '../../../examples/rate-limit-redis/key-prefix';
import { app as quickStart } from '../../../examples/rate-limit-redis/quick-start';
import { app as resetAfterLogin } from '../../../examples/rate-limit-redis/reset-after-login';
import { client as sharedClient, store as sharedStore } from '../../../examples/rate-limit-redis/shared-client';

// The samples need a running Redis. RedisStore creates its client with
// redis-extension when a sample loads; an in-memory client stands in for
// Redis and records the TTL of every SET.
const redis = vi.hoisted(() => {
    const entries = new Map<string, string>();
    const ttls = new Map<string, number>();
    const inputs: unknown[] = [];
    const state = { failing: false };

    const client = {
        get: async (key: string) => {
            if (state.failing) {
                throw new Error('Connection is closed.');
            }

            return entries.get(key) ?? null;
        },
        set: async (key: string, value: number, mode: string, ttl: number) => {
            entries.set(key, String(value));
            ttls.set(key, mode === 'PX' ? ttl : -1);

            return 'OK';
        },
        del: async (key: string) => {
            entries.delete(key);
            ttls.delete(key);

            return 1;
        },
    };

    return {
        entries,
        ttls,
        inputs,
        state,
        client,
    };
});

vi.mock('redis-extension', () => ({
    createClient: (...args: unknown[]) => {
        redis.inputs.push(args);

        return redis.client;
    },
}));

// recorded while the samples were imported, in import order
const constructed = [...redis.inputs];

function request(path: string, init: RequestInit & { ip?: string } = {}): Request {
    const { ip, ...rest } = init;
    const output = new Request(`http://localhost${path}`, rest);

    if (ip) {
        Object.defineProperty(output, 'ip', { value: ip });
    }

    return output;
}

function login(password: string, ip: string): Request {
    return request('/login', {
        ip,
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ password }),
    });
}

beforeEach(() => {
    redis.entries.clear();
    redis.ttls.clear();
    redis.state.failing = false;
});

describe('constructor', () => {
    it('creates a client for localhost without an argument, for a URL with one', () => {
        // connect-url, key-prefix (two stores), quick-start, reset-after-login, shared-client
        expect(constructed).toEqual([
            [{ url: 'redis://user:secret@redis.internal:6379/0' }],
            [],
            [],
            [],
            [],
            [{ url: undefined }],
        ]);
    });

    it('treats undefined like no argument', () => {
        redis.inputs.length = 0;

        const store = new RedisStore(undefined);

        expect(redis.inputs).toEqual([[]]);
        expect(store.client).toBe(redis.client);
    });

    it('uses a passed client without creating one', () => {
        expect(sharedStore.client).toBe(sharedClient);
    });
});

describe('quick-start', () => {
    it('counts in Redis under rate-limit:<key> with a TTL of windowMs', async () => {
        const response = await quickStart.fetch(request('/', { ip: '10.0.0.1' }));

        expect(response.status).toBe(200);
        expect(response.headers.get('ratelimit-remaining')).toBe('99');
        expect(response.headers.get('ratelimit-reset')).toBe('900');
        expect(redis.entries.get('rate-limit:10.0.0.1')).toBe('1');
        expect(redis.ttls.get('rate-limit:10.0.0.1')).toBe(900000);
    });

    it('renews the TTL and the reset time on every hit', async () => {
        await quickStart.fetch(request('/', { ip: '10.0.0.1' }));

        redis.ttls.set('rate-limit:10.0.0.1', 1);

        const response = await quickStart.fetch(request('/', { ip: '10.0.0.1' }));

        expect(redis.entries.get('rate-limit:10.0.0.1')).toBe('2');
        expect(redis.ttls.get('rate-limit:10.0.0.1')).toBe(900000);
        expect(response.headers.get('ratelimit-reset')).toBe('900');
    });

    it('rejects a client whose shared counter is above the quota', async () => {
        // another instance has counted 100 hits already
        redis.entries.set('rate-limit:10.0.0.2', '100');

        const response = await quickStart.fetch(request('/', { ip: '10.0.0.2' }));

        expect(response.status).toBe(429);
        expect(redis.entries.get('rate-limit:10.0.0.2')).toBe('101');
    });

    it('fails the request with 500 when Redis fails', async () => {
        redis.state.failing = true;

        const response = await quickStart.fetch(request('/', { ip: '10.0.0.3' }));

        expect(response.status).toBe(500);
    });
});

describe('connect-url', () => {
    it('counts with the default limiter options', async () => {
        const response = await connectUrl.fetch(request('/', { ip: '10.0.0.4' }));

        expect(response.headers.get('ratelimit-limit')).toBe('5');
        expect(redis.ttls.get('rate-limit:10.0.0.4')).toBe(60000);
    });
});

describe('key-prefix', () => {
    it('keeps separate counters for the two limiters', async () => {
        await keyPrefix.fetch(request('/login', { ip: '10.0.0.5', method: 'POST' }));

        expect(redis.entries.get('rate-limit:10.0.0.5')).toBe('1');
        expect(redis.entries.get('rate-limit:login:10.0.0.5')).toBe('1');

        await keyPrefix.fetch(request('/', { ip: '10.0.0.5' }));

        expect(redis.entries.get('rate-limit:10.0.0.5')).toBe('2');
        expect(redis.entries.get('rate-limit:login:10.0.0.5')).toBe('1');
    });
});

describe('reset-after-login', () => {
    it('deletes the counter of the client after a successful login', async () => {
        for (let i = 0; i < 3; i++) {
            expect((await resetAfterLogin.fetch(login('wrong', '10.0.0.6'))).status).toBe(401);
        }

        expect(redis.entries.get('rate-limit:10.0.0.6')).toBe('3');

        const response = await resetAfterLogin.fetch(login('secret', '10.0.0.6'));

        expect(await response.text()).toBe('Welcome');
        expect(redis.entries.has('rate-limit:10.0.0.6')).toBe(false);
    });

    it('rejects the sixth failed attempt', async () => {
        for (let i = 0; i < 5; i++) {
            await resetAfterLogin.fetch(login('wrong', '10.0.0.7'));
        }

        expect((await resetAfterLogin.fetch(login('secret', '10.0.0.7'))).status).toBe(429);
    });
});

describe('behaviour stated on the page', () => {
    it('decrements with a fresh TTL when the limiter uncounts a request', async () => {
        const app = new App();

        app.use(rateLimit({ skipFailedRequest: true, store: new RedisStore() }));
        app.get('/', defineCoreHandler((event) => {
            event.response.status = 500;

            return 'failed';
        }));

        redis.entries.set('rate-limit:10.0.0.8', '3');

        await app.fetch(request('/', { ip: '10.0.0.8' }));

        // the SET of decrement() is not awaited
        await vi.waitFor(() => expect(redis.entries.get('rate-limit:10.0.0.8')).toBe('3'));
        expect(redis.ttls.get('rate-limit:10.0.0.8')).toBe(60000);
    });

    it('does nothing on decrement of a missing key', async () => {
        const store = new RedisStore();

        store.init({ windowMs: 1000 } as Parameters<RedisStore['init']>[0]);

        await store.decrement('10.0.0.9');

        expect(redis.entries.has('rate-limit:10.0.0.9')).toBe(false);
    });

    it('returns a reset time windowMs from now', async () => {
        const store = new RedisStore();

        store.init({ windowMs: 1000 } as Parameters<RedisStore['init']>[0]);

        const before = Date.now();
        const { totalHits, resetTime } = await store.increment('10.0.0.10');

        expect(totalHits).toBe(1);
        expect(resetTime!.getTime() - before).toBeGreaterThanOrEqual(1000);
        expect(resetTime!.getTime() - Date.now()).toBeLessThanOrEqual(1000);
    });
});
