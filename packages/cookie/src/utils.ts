import type { IRoutupEvent } from 'routup';
import { parse } from 'cookie-es';
import type { ParseOptions } from './types';

export function parseRequestCookies(event: IRoutupEvent, options?: ParseOptions) {
    return parse(event.headers.get('cookie') || '', options || {});
}

export function isObject(item: unknown) : item is Record<string, any> {
    return (
        !!item &&
        typeof item === 'object' &&
        !Array.isArray(item)
    );
}
