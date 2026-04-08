import type { IRoutupEvent } from 'routup';
import { createError } from 'routup';
import type { JsonOptions } from '../types';
import {
    isObject,
    matchContentType,
} from '../utils';
import { readRequestBodyRaw } from './read-raw';

/**
 * Parses the request body as JSON.
 *
 * Returns `undefined` if the request's content-type does not match.
 * Throws a 400 error for malformed JSON or strict mode violations.
 *
 * @param event - The routup event.
 * @param options - JSON parsing options (limit, strict, reviver, type).
 */
export async function parseJsonBody(
    event: IRoutupEvent,
    options: JsonOptions,
): Promise<Record<string, any> | undefined> {
    if (!matchContentType(event, options.type ?? 'application/json')) {
        return undefined;
    }

    const raw = await readRequestBodyRaw(event, { ...options, cache: true });
    const text = new TextDecoder().decode(raw);

    if (!text) {
        return {};
    }

    let parsed: unknown;

    try {
        parsed = JSON.parse(text, options.reviver as (key: string, value: any) => any);
    } catch (e) {
        throw createError({
            statusCode: 400,
            statusMessage: `invalid JSON: ${e instanceof Error ? e.message : 'parse error'}`,
        });
    }

    if (options.strict !== false && !isObject(parsed) && !Array.isArray(parsed)) {
        throw createError({
            statusCode: 400,
            statusMessage: 'request body must be an object or array in strict mode',
        });
    }

    return parsed as Record<string, any>;
}
