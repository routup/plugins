import type { IRoutupEvent } from 'routup';
import { isObject } from './utils';

const CookieSymbol = Symbol.for('ReqCookie');

export function useRequestCookies(
    event: IRoutupEvent,
) : Record<string, string> {
    if (CookieSymbol in event.store) {
        return event.store[CookieSymbol] as Record<string, string>;
    }

    return {};
}

export function hasRequestCookies(event: IRoutupEvent) {
    return CookieSymbol in event.store &&
        isObject(event.store[CookieSymbol]);
}

export function useRequestCookie(event: IRoutupEvent, name: string) : string | undefined {
    return useRequestCookies(event)[name];
}

export function setRequestCookies(event: IRoutupEvent, key: string, value: unknown) : void;
export function setRequestCookies(event: IRoutupEvent, record: Record<string, any>) : void;
export function setRequestCookies(event: IRoutupEvent, key: Record<string, any> | string, value?: unknown) : void {
    if (isObject(key)) {
        event.store[CookieSymbol] = key;
        return;
    }

    event.store[CookieSymbol] = { [key]: value };
}
