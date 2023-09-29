import type { Request } from 'routup';
import { isObject } from './utils';

const CookieSymbol = Symbol.for('ReqCookie');

export function useRequestCookies(
    req: Request,
) : Record<string, string> {
    if (CookieSymbol in req) {
        return (req as any)[CookieSymbol];
    }

    return {};
}

export function hasRequestCookies(req: Request) {
    return CookieSymbol in req &&
        isObject((req as any)[CookieSymbol]);
}

export function useRequestCookie(req: Request, name: string) : string | undefined {
    return useRequestCookies(req)[name];
}

export function setRequestCookies(req: Request, key: string, value: unknown) : void;
export function setRequestCookies(req: Request, record: Record<string, any>) : void;
export function setRequestCookies(req: Request, key: Record<string, any> | string, value?: unknown) : void {
    if (isObject(key)) {
        (req as any)[CookieSymbol] = key;
        return;
    }

    (req as any)[CookieSymbol] = {
        [key]: value,
    };
}
