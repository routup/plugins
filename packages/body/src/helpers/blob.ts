import type { IRoutupEvent } from 'routup';
import type { LimitOptions } from '../types';
import { boolToObject, readRawBody } from '../utils';
import { getBodyOptions } from './options';

/**
 * Reads the request body as a `Blob`.
 *
 * The blob's `type` is set from the request's `content-type` header.
 *
 * @param event - The routup event.
 * @param options - Optional limit options.
 */
export async function readRequestBodyBlob(
    event: IRoutupEvent,
    options?: LimitOptions,
): Promise<Blob> {
    const opts = options ?? boolToObject(getBodyOptions(event).raw || {});
    const raw = await readRawBody(event, opts);
    const contentType = event.headers.get('content-type') || 'application/octet-stream';
    return new Blob([raw.buffer as ArrayBuffer], { type: contentType });
}
