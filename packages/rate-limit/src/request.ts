import type { IRoutupEvent } from 'routup';
import type { RateLimitInfo } from './type';
import { isObject } from './utils';

const RateLimitSymbol = Symbol.for('@routup/rate-limit:ReqRateLimit');

export function useRequestRateLimitInfo(event: IRoutupEvent) : Partial<RateLimitInfo>;
export function useRequestRateLimitInfo<K extends keyof RateLimitInfo>(event: IRoutupEvent, key: K) : RateLimitInfo[K] | undefined;
export function useRequestRateLimitInfo(event: IRoutupEvent, key?: string) {
    if (RateLimitSymbol in event.store) {
        if (typeof key === 'string') {
            return (event.store[RateLimitSymbol] as Record<string, unknown>)[key];
        }

        return event.store[RateLimitSymbol];
    }

    return typeof key === 'string' ?
        undefined :
        {};
}

export function setRequestRateLimitInfo<K extends keyof RateLimitInfo>(
    event: IRoutupEvent,
    key: K,
    value: RateLimitInfo[K],
) : void;
export function setRequestRateLimitInfo(event: IRoutupEvent, record: RateLimitInfo) : void;
export function setRequestRateLimitInfo(event: IRoutupEvent, key: RateLimitInfo | string, value?: unknown) : void {
    const existing = RateLimitSymbol in event.store ?
        event.store[RateLimitSymbol] as Record<string, unknown> :
        undefined;

    if (isObject(key)) {
        event.store[RateLimitSymbol] = existing ? { ...existing, ...key } : key;
    } else if (existing) {
        existing[key] = value;
    } else {
        event.store[RateLimitSymbol] = { [key]: value };
    }
}
