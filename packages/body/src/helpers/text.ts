import type { IRoutupEvent } from 'routup';
import type { TextOptions } from '../types';
import { boolToObject, readRawBody } from '../utils';
import { getBodyOptions } from './options';

/**
 * Reads the request body as a string.
 *
 * Uses the `defaultCharset` option (defaults to `'utf-8'`) for decoding.
 * The underlying raw bytes are cached, but the string is decoded on each call.
 *
 * @param event - The routup event.
 * @param options - Optional text parsing options (limit, charset).
 */
export async function readRequestBodyText(
    event: IRoutupEvent,
    options?: TextOptions,
): Promise<string> {
    const opts = options ?? boolToObject(getBodyOptions(event).text || {});
    const raw = await readRawBody(event, opts);
    return new TextDecoder(opts.defaultCharset ?? 'utf-8').decode(raw);
}
