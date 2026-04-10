import type { IRoutupEvent } from 'routup';
import { PluginNotInstalledError } from 'routup';
import { BodySymbol, OptionsSymbol } from '../constants';
import { boolToObject } from '../utils';
import { getBodyOptions } from './options';
import { parseJsonBody } from './parse-json';
import { parseUrlEncodedBody } from './parse-url-encoded';

/**
 * Returns the parsed request body (JSON or URL-encoded).
 *
 * The result is lazily parsed on first call and cached for subsequent access.
 * Requires the `body()` plugin to be installed for content-type matching and options.
 *
 * @param event - The routup event.
 */
export async function readRequestBody(event: IRoutupEvent): Promise<Record<string, any>>;

/**
 * Returns the parsed request body (JSON or URL-encoded).
 *
 * The result is lazily parsed on first call and cached for subsequent access.
 * Requires the `body()` plugin to be installed for content-type matching and options.
 *
 * @param event - The routup event.
 * @param key - Optional key to retrieve a single property from the parsed body.
 */
export async function readRequestBody(event: IRoutupEvent, key: string): Promise<any | undefined>;

export async function readRequestBody(event: IRoutupEvent, key?: string) {
    if (BodySymbol in event.store) {
        const cached = event.store[BodySymbol] as Record<string, any>;
        return typeof key === 'string' ? cached[key] : cached;
    }

    if (!(OptionsSymbol in event.store)) {
        throw new PluginNotInstalledError('@routup/body', 'readRequestBody');
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
