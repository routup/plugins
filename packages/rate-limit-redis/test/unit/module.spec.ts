import { 
    beforeEach, 
    describe, 
    expect, 
    it, 
    vi, 
} from 'vitest';
import type { Options } from '@routup/rate-limit';
import { RedisStore } from '../../src';

function createMockClient() {
    const store = new Map<string, string>();

    return {
        get: vi.fn(async (key: string) => store.get(key) ?? null),
        set: vi.fn(async (key: string, value: number | string, _mode: string, _px: number) => {
            store.set(key, String(value));
            return 'OK';
        }),
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
        store = new (RedisStore as any)();
        (store as any).client = mockClient;
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
});
