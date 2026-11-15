import type { IAppEvent } from 'routup';
import { BodySymbol } from '../constants';
import { boolToObject, isObject } from '../utils';
import { getBodyOptions } from './options';
import { parseJsonBody } from './parse-json';
import { parseUrlEncodedBody } from './parse-url-encoded';

function pick(body: unknown, key?: string) {
    if (typeof key !== 'string') {
        return body;
    }

    // A keyed read only resolves own properties of an object body: `null`,
    // a primitive or an array (non-strict JSON, a consumer-set body) has no
    // fields, and inherited members such as `constructor` are not fields.
    if (!isObject(body) || !Object.hasOwn(body, key)) {
        return undefined;
    }

    return body[key];
}

/**
 * Returns the parsed request body (JSON or URL-encoded).
 *
 * The result is lazily parsed on first call and cached for subsequent access.
 * Requires the `body()` plugin to be installed for content-type matching and options.
 *
 * @param event - The routup event.
 */
export async function readRequestBody(event: IAppEvent): Promise<Record<string, any>>;

/**
 * Returns the parsed request body (JSON or URL-encoded).
 *
 * The result is lazily parsed on first call and cached for subsequent access.
 * Requires the `body()` plugin to be installed for content-type matching and options.
 *
 * @param event - The routup event.
 * @param key - Key of a single property of the parsed body. Resolves to
 * `undefined` when the body is not an object (e.g. `null`, a primitive or an
 * array) or has no own property of that name.
 */
export async function readRequestBody(event: IAppEvent, key: string): Promise<any | undefined>;

export async function readRequestBody(event: IAppEvent, key?: string) {
    if (BodySymbol in event.store) {
        return pick(event.store[BodySymbol], key);
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

    return pick(body, key);
}
