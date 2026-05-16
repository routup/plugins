import type { IAppEvent } from 'routup';
import { isObject } from './utils';

const CookieSymbol = Symbol.for('@routup/cookie:ReqCookie');

export function useRequestCookies(
    event: IAppEvent,
) : Record<string, string> {
    if (CookieSymbol in event.store) {
        return event.store[CookieSymbol] as Record<string, string>;
    }

    return {};
}

export function hasRequestCookies(event: IAppEvent) {
    return CookieSymbol in event.store &&
        isObject(event.store[CookieSymbol]);
}

export function useRequestCookie(event: IAppEvent, name: string) : string | undefined {
    return useRequestCookies(event)[name];
}

export function setRequestCookies(event: IAppEvent, key: string, value: unknown) : void;
export function setRequestCookies(event: IAppEvent, record: Record<string, any>) : void;
export function setRequestCookies(event: IAppEvent, key: Record<string, any> | string, value?: unknown) : void {
    if (isObject(key)) {
        event.store[CookieSymbol] = key;
        return;
    }

    const existing = CookieSymbol in event.store ?
        event.store[CookieSymbol] as Record<string, any> :
        {};
    event.store[CookieSymbol] = { ...existing, [key]: value };
}
