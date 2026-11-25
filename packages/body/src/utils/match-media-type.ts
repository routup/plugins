/**
 * Whether a media type (lowercase, no parameters) matches a type or a
 * pattern such as `text/*` or `application/*+json`, by the rules of routup's
 * `assertRequestContentType()`.
 */
export function matchMediaType(mediaType: string, type: string): boolean {
    const expected = type.split(';')[0]!.trim().toLowerCase();

    if (expected === mediaType) {
        return true;
    }

    const [actualType, actualSubtype = ''] = mediaType.split('/');
    const [expectedType, expectedSubtype] = expected.split('/');

    if (!expectedSubtype || expectedType !== actualType) {
        return false;
    }

    return expectedSubtype === '*' ||
        (expectedSubtype.startsWith('*+') && actualSubtype.endsWith(expectedSubtype.slice(1)));
}
