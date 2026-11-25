import type { IAppEvent } from 'routup';
import { assertRequestContentType } from 'routup';
import { BodySymbol } from '../constants';
import type { Options } from '../types';
import {
    boolToObject,
    hasRequestBody,
    isObject,
    matchContentType,
} from '../utils';
import { getBodyOptions } from './options';
import { parseJsonBody } from './parse-json';
import { parseUrlEncodedBody } from './parse-url-encoded';

function toList(input: string | string[]): string[] {
    return Array.isArray(input) ? input : [input];
}

/**
 * Answers 415 for a body whose content-type no enabled parser accepts, and
 * 400 for a malformed one (`strictContentType`).
 */
function assertBodyContentType(event: IAppEvent, options: Options): void {
    if (!hasRequestBody(event)) {
        return;
    }

    const types: string[] = [];

    if (options.json) {
        types.push(...toList(boolToObject(options.json).type ?? 'application/json'));
    }

    if (options.urlEncoded) {
        types.push(...toList(boolToObject(options.urlEncoded).type ?? 'application/x-www-form-urlencoded'));
    }

    // The parsers decide by `matchContentType()`, which also resolves an
    // extension such as `json`; routup only shapes the 415 or 400. A missing
    // or empty header matches there, so it goes to routup directly.
    if (
        !event.request.headers.get('content-type') ||
        !matchContentType(event, types)
    ) {
        assertRequestContentType(event, types);
    }
}

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

    try {
        if (options.strictContentType) {
            assertBodyContentType(event, options);
        }

        if (options.json) {
            body = await parseJsonBody(event, boolToObject(options.json));
        }

        if (body === undefined && options.urlEncoded) {
            body = await parseUrlEncodedBody(event, boolToObject(options.urlEncoded));
        }
    } catch (e) {
        // A body provided while this read was parsing is the result, also
        // when the request body itself is malformed.
        if (BodySymbol in event.store) {
            return pick(event.store[BodySymbol], key);
        }

        throw e;
    }

    body ??= {};

    // `setRequestBody()` may have provided a body while this read was
    // parsing: that value wins over the parsed one.
    if (BodySymbol in event.store) {
        return pick(event.store[BodySymbol], key);
    }

    event.store[BodySymbol] = body;

    return pick(body, key);
}

/**
 * Provides the parsed request body, e.g. from a custom body reader.
 *
 * `readRequestBody()` (and `@DBody()` of `@routup/decorators`) return this
 * value from then on, without reading the request stream. A value set before
 * the first read means the stream is never touched; a value set afterwards
 * replaces the parsed body. A value set while a read is still parsing is
 * what that read resolves to, even when the request body fails to parse.
 *
 * @param event - The routup event.
 * @param value - The parsed body, usually an object.
 */
export function setRequestBody(event: IAppEvent, value: unknown): void {
    event.store[BodySymbol] = value;
}
