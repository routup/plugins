import type { IRoutupEvent } from 'routup';
import type { LimitOptions } from '../types';
import { boolToObject, readRawBody } from '../utils';
import { getBodyOptions } from './options';

/**
 * Reads the request body as an `ArrayBuffer`.
 *
 * @param event - The routup event.
 * @param options - Optional limit options.
 */
export async function readRequestBodyArrayBuffer(
    event: IRoutupEvent,
    options?: LimitOptions,
): Promise<ArrayBuffer> {
    const opts = options ?? boolToObject(getBodyOptions(event).raw || {});
    const raw = await readRawBody(event, opts);
    return raw.buffer as ArrayBuffer;
}
