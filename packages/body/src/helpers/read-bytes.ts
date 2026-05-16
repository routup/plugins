import type { IAppEvent } from 'routup';
import type { RawOptions } from '../types';
import { boolToObject } from '../utils';
import { readRequestBodyRaw } from './read-raw';
import { getBodyOptions } from './options';

/**
 * Reads the request body as a `Uint8Array`.
 *
 * @param event - The routup event.
 * @param options - Optional raw parsing options (limit, cache).
 */
export async function readRequestBodyBytes(
    event: IAppEvent,
    options?: RawOptions,
): Promise<Uint8Array> {
    const opts = options ?? boolToObject(getBodyOptions(event).raw || {});
    return readRequestBodyRaw(event, opts);
}
