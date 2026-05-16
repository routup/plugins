import type { IAppEvent } from 'routup';
import type { TextOptions } from '../types';
import { boolToObject } from '../utils';
import { readRequestBodyRaw } from './read-raw';
import { getBodyOptions } from './options';

/**
 * Reads the request body as a string.
 *
 * Uses the `defaultCharset` option (defaults to `'utf-8'`) for decoding.
 *
 * @param event - The routup event.
 * @param options - Optional text parsing options (limit, charset, cache).
 */
export async function readRequestBodyText(
    event: IAppEvent,
    options?: TextOptions,
): Promise<string> {
    const opts = options ?? boolToObject(getBodyOptions(event).text || {});
    const raw = await readRequestBodyRaw(event, opts);
    return new TextDecoder(opts.defaultCharset ?? 'utf-8').decode(raw);
}
