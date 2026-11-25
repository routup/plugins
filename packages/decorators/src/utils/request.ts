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
        // An invalid length (`abc`, `3, 3`) counts as a body, so that it is
        // checked rather than let through.
        return Number(contentLength) !== 0;
    }

    return headers.has('content-type');
}
