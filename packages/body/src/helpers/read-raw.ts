import type { IRoutupEvent } from 'routup';
import { createError } from 'routup';
import type { LimitOptions } from '../types';
import { parseSize } from '../utils';
import { readRequestBodyStream } from './read-stream';

const RawBodySymbol = Symbol.for('ReqRawBody');

/**
 * Reads the full request body as a `Uint8Array`.
 *
 * Uses `readRequestBodyStream` internally and collects all chunks.
 * The result is cached in `event.store` for subsequent calls.
 * Enforces the size limit on actual decompressed bytes (not just content-length).
 *
 * @param event - The routup event.
 * @param options - Optional limit options.
 */
export async function readRequestBodyRaw(
    event: IRoutupEvent,
    options: LimitOptions = {},
): Promise<Uint8Array> {
    if (RawBodySymbol in event.store) {
        return event.store[RawBodySymbol] as Uint8Array;
    }

    const limit = options.limit ? parseSize(options.limit) : undefined;
    const stream = readRequestBodyStream(event, options);

    const chunks: Uint8Array[] = [];
    let totalSize = 0;

    if (stream) {
        const reader = stream.getReader();

        for (;;) {
            const { done, value } = await reader.read();
            if (done) break;

            totalSize += value.length;

            if (limit && totalSize > limit) {
                await reader.cancel();
                throw createError({
                    statusCode: 413,
                    statusMessage: 'request entity too large',
                });
            }

            chunks.push(value);
        }
    }

    const bytes = concat(chunks, totalSize);
    event.store[RawBodySymbol] = bytes;
    return bytes;
}

function concat(chunks: Uint8Array[], totalSize: number): Uint8Array {
    if (chunks.length === 0) {
        return new Uint8Array(0);
    }

    if (chunks.length === 1) {
        return chunks[0]!;
    }

    const result = new Uint8Array(totalSize);
    let offset = 0;

    for (const chunk of chunks) {
        result.set(chunk, offset);
        offset += chunk.length;
    }

    return result;
}
