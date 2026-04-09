import type { IRoutupEvent } from 'routup';
import { createError } from 'routup';
import type { BaseOptions } from '../types';
import { createDecompressor, parseSize } from '../utils';

/**
 * Returns the request body as a `ReadableStream`, decompressed if needed.
 *
 * Performs a content-length pre-check against the limit but does not
 * buffer or cache the stream. Returns `null` if there is no body.
 *
 * @param event - The routup event.
 * @param options - Optional limit options (content-length pre-check only).
 */
export function readRequestBodyStream(
    event: IRoutupEvent,
    options: BaseOptions = {},
): ReadableStream | null {
    const limit = options.limit !== undefined ? parseSize(options.limit) : undefined;

    if (limit !== undefined) {
        const contentLength = event.headers.get('content-length');
        if (contentLength && Number.parseInt(contentLength, 10) > limit) {
            throw createError({
                statusCode: 413,
                message: 'request entity too large',
            });
        }
    }

    const encoding = (event.headers.get('content-encoding') || 'identity').toLowerCase();

    let stream = event.request.body;

    if (encoding !== 'identity' && stream) {
        stream = stream.pipeThrough(createDecompressor(encoding));
    }

    return stream;
}
