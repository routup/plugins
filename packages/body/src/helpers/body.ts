import type { IRoutupEvent } from 'routup';
import { boolToObject } from '../utils';
import { parseJsonBody } from './json';
import { getBodyOptions } from './options';
import { parseUrlEncodedBody } from './url-encoded';

const BodySymbol = Symbol.for('ReqBody');

/**
 * Returns the parsed request body (JSON or URL-encoded).
 *
 * The result is lazily parsed on first call and cached for subsequent access.
 * Requires the `body()` plugin to be installed for content-type matching and options.
 *
 * @param event - The routup event.
 * @param key - Optional key to retrieve a single property from the parsed body.
 */
export async function useRequestBody(event: IRoutupEvent): Promise<Record<string, any>>;
export async function useRequestBody(event: IRoutupEvent, key: string): Promise<any | undefined>;
export async function useRequestBody(event: IRoutupEvent, key?: string) {
    if (BodySymbol in event.store) {
        const cached = event.store[BodySymbol] as Record<string, any>;
        return typeof key === 'string' ? cached[key] : cached;
    }

    const options = getBodyOptions(event);
    let body: Record<string, any> | undefined;

    if (options.json) {
        body = await parseJsonBody(event, boolToObject(options.json));
    }

    if (body === undefined && options.urlEncoded) {
        body = await parseUrlEncodedBody(event, boolToObject(options.urlEncoded));
    }

    body ??= {};

    event.store[BodySymbol] = body;

    return typeof key === 'string' ? body[key] : body;
}