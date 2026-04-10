import type { IRoutupEvent } from 'routup';
import { PluginNotInstalledError } from 'routup';
import { isObject } from './utils';

const CookieSymbol = Symbol('ReqCookie');

export function useRequestCookies(
    event: IRoutupEvent,
) : Record<string, string> {
    if (!(CookieSymbol in event.store)) {
        throw new PluginNotInstalledError('@routup/cookie', 'useRequestCookies');
    }

    return event.store[CookieSymbol] as Record<string, string>;
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

    const existing = CookieSymbol in event.store ?
        event.store[CookieSymbol] as Record<string, any> :
        {};
    event.store[CookieSymbol] = { ...existing, [key]: value };
}
