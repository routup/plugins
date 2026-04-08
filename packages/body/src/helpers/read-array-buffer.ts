import type { IRoutupEvent } from 'routup';
import type { BaseOptions } from '../types';
import { boolToObject } from '../utils';
import { readRequestBodyRaw } from './read-raw';
import { getBodyOptions } from './options';

/**
 * Reads the request body as an `ArrayBuffer`.
 *
 * @param event - The routup event.
 * @param options - Optional limit options.
 */
export async function readRequestBodyArrayBuffer(
    event: IRoutupEvent,
    options?: BaseOptions,
): Promise<ArrayBuffer> {
    const opts = options ?? boolToObject(getBodyOptions(event).raw || {});
    const raw = await readRequestBodyRaw(event, opts);
    return raw.buffer as ArrayBuffer;
}
