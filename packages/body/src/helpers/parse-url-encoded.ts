import type { IRoutupEvent } from 'routup';
import { createError } from 'routup';
import type { UrlEncodedOptions } from '../types';
import { matchContentType } from '../utils';
import { readRequestBodyRaw } from './read-raw';

/**
 * Parses the request body as URL-encoded form data.
 *
 * Returns `undefined` if the request's content-type does not match.
 * Throws a 413 error if the number of parameters exceeds `parameterLimit`.
 *
 * @param event - The routup event.
 * @param options - URL-encoded parsing options (limit, parameterLimit, type).
 */
export async function parseUrlEncodedBody(
    event: IRoutupEvent,
    options: UrlEncodedOptions,
): Promise<Record<string, any> | undefined> {
    if (!matchContentType(event, options.type ?? 'application/x-www-form-urlencoded')) {
        return undefined;
    }

    const raw = await readRequestBodyRaw(event, options);
    const text = new TextDecoder().decode(raw);
    const params = new URLSearchParams(text);

    const limit = options.parameterLimit ?? 1000;
    const body: Record<string, string> = {};
    let count = 0;

    for (const [k, v] of params) {
        if (count >= limit) {
            throw createError({
                statusCode: 413,
                statusMessage: 'too many parameters',
            });
        }
        body[k] = v;
        count++;
    }

    return body;
}
