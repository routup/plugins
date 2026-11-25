import type { IAppEvent } from 'routup';
import { matchRequestContentType } from 'routup';
import { matchMediaType } from './match-media-type';

/**
 * Whether the request content-type is one of the given types. A request
 * without a content-type matches. A type may be a pattern such as `text/*`
 * or `application/*+json`, or an extension such as `json`.
 */
export function matchContentType(
    event: IAppEvent,
    types: string | string[],
): boolean {
    const header = event.request.headers.get('content-type');

    if (!header) {
        return true;
    }

    const mediaType = header.split(';')[0]!.trim().toLowerCase();
    const typeList = Array.isArray(types) ? types : [types];

    return typeList.some((type) => (type.includes('/') ?
        matchMediaType(mediaType, type) :
        matchRequestContentType(event, type)));
}
