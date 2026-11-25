// Upstream: routup/routup#1021 (local copy until routup ships hasRequestBody)
import type { IAppEvent } from 'routup';

/**
 * Whether the request has a body to check the media type of.
 *
 * `event.request.body` does not tell: the Node listener gives every request
 * but GET and HEAD a body stream (#888). The message framing decides
 * (RFC 9112, section 6.3). A request without framing headers, built by hand
 * or sent over HTTP/2, has a body when it declares a content-type.
 */
export function hasRequestBody(event: IAppEvent): boolean {
    const { body, headers } = event.request;

    // GET and HEAD have no body to read, whatever their headers say.
    if (body === null) {
        return false;
    }

    if (headers.has('transfer-encoding')) {
        return true;
    }

    const contentLength = headers.get('content-length');

    if (contentLength !== null) {
        // Only a decimal `0` is no body: an invalid length (`abc`, `0x0`,
        // `3, 3`, empty) counts as one, so that it is checked rather than
        // let through.
        return !/^\d+$/.test(contentLength) || Number(contentLength) !== 0;
    }

    return headers.has('content-type');
}
