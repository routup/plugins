import { describe, expect, it } from 'vitest';
import {
    App,
    HeaderName,
    createError,
    defineCoreHandler,
} from 'routup';
import type { Options, Store } from '../../src';
import { MemoryStore, rateLimit, useRequestRateLimitInfo } from '../../src';

function createTestRequest(url: string, options?: RequestInit): Request {
    return new Request(`http://localhost${url}`, options);
}

function createDeferred() {
    return Promise.withResolvers<void>();
}

function wait(ms: number) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

describe('window token', () => {
    it('should return the window of the memory store on increment', async () => {
        const store = new MemoryStore();

        store.init({ windowMs: 60_000 } as Options);

        const first = await store.increment('a');

        await store.resetAll();

        const second = await store.increment('a');

        expect(first.window).toBeDefined();
        expect(second.window).toBeDefined();
        expect(second.window).not.toEqual(first.window);
        clearInterval(store.interval);
    });

    it('should ignore a decrement for an ended window of the memory store', async () => {
        const store = new MemoryStore();

        store.init({ windowMs: 60_000 } as Options);

        const { window } = await store.increment('a');

        await store.resetAll();
        await store.increment('a');
        await store.decrement('a', window);

        expect(store.hits.a).toEqual(1);

        // without a token, the current window is decremented
        await store.decrement('a');
        expect(store.hits.a).toEqual(0);
        clearInterval(store.interval);
    });

    it('should not refund a request into the next window', async () => {
        const store = new MemoryStore();
        const app = new App();
        const pending = createDeferred();

        app.use(rateLimit({
            max: 1, 
            skipSuccessfulRequest: true, 
            store, 
        }));
        app.get('/slow', defineCoreHandler(async () => {
            await pending.promise;

            return 'ok';
        }));
        app.get('/fail', defineCoreHandler(() => {
            throw createError({ status: 401 });
        }));

        // the current window ends in 2 seconds
        store.resetTime = new Date(Date.now() + 2000);

        const slow = app.fetch(createTestRequest('/slow'));

        await wait(5);

        await store.resetAll();

        let response = await app.fetch(createTestRequest('/fail'));

        expect(response.status).toEqual(401);

        pending.resolve();
        response = await slow;
        expect(response.status).toEqual(200);
        // the refund was ignored: the new window's only slot is taken
        expect(response.headers.get('ratelimit-remaining')).toEqual('0');
        // and the reset time is the one of the new window
        expect(Number(response.headers.get('ratelimit-reset'))).toBeGreaterThan(2);

        response = await app.fetch(createTestRequest('/fail'));
        expect(response.status).toEqual(429);
        clearInterval(store.interval);
    });
});

describe('countAfterResponse', () => {
    it('should fail at creation when the store cannot be read', () => {
        const store : Store = {
            increment: () => ({ totalHits: 1, resetTime: undefined }),
            decrement: () => {},
            reset: () => {},
        };

        expect(() => rateLimit({ countAfterResponse: true, store })).toThrow(/get\(\)/);
    });

    it('should not count pending requests', async () => {
        const app = new App();
        const pending = createDeferred();
        let reached = 0;

        app.use(rateLimit({
            max: 2, 
            skipSuccessfulRequest: true, 
            countAfterResponse: true, 
        }));
        app.get('/slow', defineCoreHandler(async () => {
            reached++;
            await pending.promise;

            return 'ok';
        }));
        app.get('/fail', defineCoreHandler(() => {
            throw createError({ status: 401 });
        }));

        const slow = Array.from({ length: 5 }, () => app.fetch(createTestRequest('/slow')));

        await wait(5);

        expect(reached).toEqual(5);

        let response = await app.fetch(createTestRequest('/fail'));

        expect(response.status).toEqual(401);
        expect(response.headers.get(HeaderName.RATE_LIMIT_REMAINING)).toEqual('1');

        pending.resolve();

        const responses = await Promise.all(slow);

        expect(responses.map((r) => r.status)).toEqual([200, 200, 200, 200, 200]);
        expect(responses[0]!.headers.get(HeaderName.RATE_LIMIT_REMAINING)).toEqual('2');

        response = await app.fetch(createTestRequest('/fail'));
        expect(response.status).toEqual(401);
        expect(response.headers.get(HeaderName.RATE_LIMIT_REMAINING)).toEqual('0');

        response = await app.fetch(createTestRequest('/fail'));
        expect(response.status).toEqual(429);
        expect(response.headers.get(HeaderName.RATE_LIMIT_REMAINING)).toEqual('0');
        expect(response.headers.get(HeaderName.RETRY_AFTER)).toEqual('60');

        // a rejected request is not counted
        response = await app.fetch(createTestRequest('/slow'));
        expect(response.status).toEqual(429);
    });

    it('should count after the response with skipFailedRequest', async () => {
        const app = new App();

        app.use(rateLimit({
            max: 1, 
            skipFailedRequest: true, 
            countAfterResponse: true, 
        }));
        app.get('/ok', defineCoreHandler(() => Response.redirect('http://localhost/target', 302)));
        app.get('/fail', defineCoreHandler(() => {
            throw createError({ status: 500 });
        }));

        let response = await app.fetch(createTestRequest('/fail'));

        expect(response.status).toEqual(500);
        expect(response.headers.get(HeaderName.RATE_LIMIT_REMAINING)).toEqual('1');

        // the headers of a fetch() response are immutable
        response = await app.fetch(createTestRequest('/ok'));
        expect(response.status).toEqual(302);
        expect(response.headers.get('location')).toEqual('http://localhost/target');
        expect(response.headers.get(HeaderName.RATE_LIMIT_REMAINING)).toEqual('0');
        expect(response.headers.get(HeaderName.RATE_LIMIT_RESET)).not.toBeNull();

        response = await app.fetch(createTestRequest('/ok'));
        expect(response.status).toEqual(429);
    });

    it('should let concurrent requests exceed max', async () => {
        const app = new App();
        let reached = 0;

        app.use(rateLimit({
            max: 2, 
            skipSuccessfulRequest: true, 
            countAfterResponse: true, 
        }));
        app.use(defineCoreHandler(async () => {
            reached++;
            await wait(10);

            throw createError({ status: 401 });
        }));

        const responses = await Promise.all(
            Array.from({ length: 5 }, () => app.fetch(createTestRequest('/'))),
        );

        expect(reached).toEqual(5);
        expect(responses.map((r) => r.status)).toEqual([401, 401, 401, 401, 401]);
        expect((await app.fetch(createTestRequest('/'))).status).toEqual(429);
    });

    it('should keep the request info consistent', async () => {
        const app = new App();
        const seen : unknown[] = [];

        app.use(rateLimit({
            max: 3, 
            skipSuccessfulRequest: true, 
            countAfterResponse: true, 
        }));
        app.use(defineCoreHandler((event) => {
            seen.push({ ...useRequestRateLimitInfo(event) });

            throw createError({ status: 401 });
        }));

        await app.fetch(createTestRequest('/'));
        await app.fetch(createTestRequest('/'));

        expect(seen).toMatchObject([
            {
                limit: 3, 
                current: 0, 
                remaining: 3, 
            },
            {
                limit: 3, 
                current: 1, 
                remaining: 2, 
            },
        ]);
    });
});
