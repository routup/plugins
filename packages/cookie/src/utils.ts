import type { Request } from 'routup';
import { HeaderName } from 'routup';
import { parse } from 'cookie-es';
import type { ParseOptions } from './types';

export function parseRequestCookies(req: Request, options?: ParseOptions) {
    return parse(req.headers[HeaderName.COOKIE] || '', options || {});
}

export function isObject(item: unknown) : item is Record<string, any> {
    return (
        !!item &&
        typeof item === 'object' &&
        !Array.isArray(item)
    );
}
