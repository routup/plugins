import type { IRoutupEvent } from 'routup';
import type { RateLimitInfo } from './type';
import { isObject } from './utils';

const symbol = Symbol.for('ReqRateLimit');

export function useRequestRateLimitInfo(event: IRoutupEvent) : Partial<RateLimitInfo>;
export function useRequestRateLimitInfo<K extends keyof RateLimitInfo>(event: IRoutupEvent, key: K) : RateLimitInfo[K] | undefined;
export function useRequestRateLimitInfo(event: IRoutupEvent, key?: string) {
    if (symbol in event.store) {
        if (typeof key === 'string') {
            return (event.store[symbol] as Record<string, unknown>)[key];
        }

        return event.store[symbol];
    }

    return {};
}

export function setRequestRateLimitInfo<K extends keyof RateLimitInfo>(
    event: IRoutupEvent,
    key: K,
    value: RateLimitInfo[K],
) : void;
export function setRequestRateLimitInfo(event: IRoutupEvent, record: RateLimitInfo) : void;
export function setRequestRateLimitInfo(event: IRoutupEvent, key: RateLimitInfo | string, value?: unknown) : void {
    const existing = symbol in event.store ?
        event.store[symbol] as Record<string, unknown> :
        undefined;

    if (isObject(key)) {
        event.store[symbol] = existing ? { ...existing, ...key } : key;
    } else if (existing) {
        existing[key] = value;
    } else {
        event.store[symbol] = { [key]: value };
    }
}
