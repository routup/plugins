import type { IRoutupEvent } from 'routup';
import { createError } from 'routup';
import { RawBodySymbol } from '../constants';
import type { BaseOptions } from '../types';
import { parseSize } from '../utils';
import { readRequestBodyStream } from './read-stream';

/**
 * Reads the full request body as a `Uint8Array`.
 *
 * Uses `readRequestBodyStream` internally and collects all chunks.
 * Enforces the size limit on actual decompressed bytes (not just content-length).
 *
 * When `cache` is `true`, the result is stored in `event.store` so subsequent
 * calls return the same bytes without re-reading. Defaults to `false` to avoid
 * holding large payloads in memory.
 *
 * @param event - The routup event.
 * @param options - Optional limit and cache options.
 */
export async function readRequestBodyRaw(
    event: IRoutupEvent,
    options: BaseOptions = {},
): Promise<Uint8Array> {
    if (options.cache && RawBodySymbol in event.store) {
        return event.store[RawBodySymbol] as Uint8Array;
    }

    const limit = options.limit !== undefined ? parseSize(options.limit) : undefined;
    const stream = readRequestBodyStream(event, options);

    const chunks: Uint8Array[] = [];
    let totalSize = 0;

    if (stream) {
        const reader = stream.getReader();

        for (;;) {
            const { done, value } = await reader.read();
            if (done) break;

            totalSize += value.length;

            if (limit !== undefined && totalSize > limit) {
                await reader.cancel();
                throw createError({
                    statusCode: 413,
                    message: 'request entity too large',
                });
            }

            chunks.push(value);
        }
    }

    const bytes = concat(chunks, totalSize);

    if (options.cache) {
        event.store[RawBodySymbol] = bytes;
    }

    return bytes;
}

function concat(chunks: Uint8Array[], totalSize: number): Uint8Array {
    if (chunks.length === 0) {
        return new Uint8Array(0);
    }

    if (chunks.length === 1) {
        return new Uint8Array(chunks[0]!);
    }

    const result = new Uint8Array(totalSize);
    let offset = 0;

    for (const chunk of chunks) {
        result.set(chunk, offset);
        offset += chunk.length;
    }

    return result;
}
