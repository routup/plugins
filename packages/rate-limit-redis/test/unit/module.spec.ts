import { 
    beforeEach, 
    describe, 
    expect, 
    it, 
    vi, 
} from 'vitest';
import {
    App,
    HeaderName,
    createError,
    defineCoreHandler,
} from 'routup';
import type { Options } from '@routup/rate-limit';
import { rateLimit } from '@routup/rate-limit';
import { RedisStore } from '../../src';

function createMockClient() {
    const store = new Map<string, string>();

    return {
        get: vi.fn(async (key: string) => store.get(key) ?? null),
        set: vi.fn(async (key: string, value: number | string, _mode: string, _px: number) => {
            store.set(key, String(value));

            return 'OK';
        }),
        pttl: vi.fn(async (key: string): Promise<number> => (store.has(key) ? 30000 : -2)),
        del: vi.fn(async (key: string) => {
            store.delete(key);

            return 1;
        }),
        _store: store,
    };
}

describe('src/module', () => {
    let store: RedisStore;
    let mockClient: ReturnType<typeof createMockClient>;

    beforeEach(() => {
        mockClient = createMockClient();
        store = new RedisStore(mockClient as any);
        store.init({ windowMs: 60000 } as Options);
    });

    it('should increment a key', async () => {
        const result = await store.increment('test-key');

        expect(result.totalHits).toEqual(1);
        expect(result.resetTime).toBeInstanceOf(Date);
        expect(mockClient.set).toHaveBeenCalledWith('rate-limit:test-key', 1, 'PX', 60000);
    });

    it('should increment an existing key', async () => {
        await store.increment('test-key');

        const result = await store.increment('test-key');

        expect(result.totalHits).toEqual(2);
    });

    it('should decrement a key', async () => {
        await store.increment('test-key');
        await store.increment('test-key');
        await store.decrement('test-key');

        expect(mockClient.set).toHaveBeenLastCalledWith('rate-limit:test-key', 1, 'PX', 60000);
    });

    it('should not decrement a non-existent key', async () => {
        await store.decrement('nonexistent');

        expect(mockClient.set).not.toHaveBeenCalled();
    });

    it('should reset a key', async () => {
        await store.increment('test-key');
        await store.reset('test-key');

        expect(mockClient.del).toHaveBeenCalledWith('rate-limit:test-key');
    });

    it('should prefix keys with rate-limit:', async () => {
        await store.increment('my-ip');

        expect(mockClient.get).toHaveBeenCalledWith('rate-limit:my-ip');
        expect(mockClient.set).toHaveBeenCalledWith('rate-limit:my-ip', 1, 'PX', 60000);
    });

    it('should read a key without incrementing it', async () => {
        expect(await store.get('test-key')).toBeUndefined();

        await store.increment('test-key');
        await store.increment('test-key');

        const before = Date.now();
        const result = await store.get('test-key');

        expect(result?.totalHits).toEqual(2);
        expect(result?.resetTime).toBeInstanceOf(Date);
        expect(result!.resetTime!.getTime()).toBeGreaterThanOrEqual(before + 30000);
        expect(mockClient.pttl).toHaveBeenCalledWith('rate-limit:test-key');
        expect(mockClient._store.get('rate-limit:test-key')).toEqual('2');
    });

    it('should treat a key that expires between GET and PTTL as missing', async () => {
        await store.increment('test-key');

        mockClient.pttl.mockResolvedValueOnce(-2);

        expect(await store.get('test-key')).toBeUndefined();
    });

    it('should keep a key without expiry', async () => {
        await store.increment('test-key');

        mockClient.pttl.mockResolvedValueOnce(-1);

        expect(await store.get('test-key')).toEqual({ totalHits: 1, resetTime: undefined });
    });

    it('should count after the response with the redis store', async () => {
        const app = new App();

        app.use(rateLimit({
            max: 1,
            skipSuccessfulRequest: true,
            countAfterResponse: true,
            store,
        }));
        app.get('/ok', defineCoreHandler(() => 'ok'));
        app.get('/fail', defineCoreHandler(() => {
            throw createError({ status: 401 });
        }));

        let response = await app.fetch(new Request('http://localhost/ok'));

        expect(response.status).toEqual(200);

        response = await app.fetch(new Request('http://localhost/fail'));
        expect(response.status).toEqual(401);
        expect(response.headers.get(HeaderName.RATE_LIMIT_REMAINING)).toEqual('0');

        response = await app.fetch(new Request('http://localhost/ok'));
        expect(response.status).toEqual(429);
    });
});
