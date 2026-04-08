import type { IRoutupEvent } from 'routup';
import { parse } from 'qs';

import type { ParseOptions } from './type';

export function parseRequestQuery(event: IRoutupEvent, options?: ParseOptions) {
    const { url } = event.request;
    const qIndex = url.indexOf('?');
    const search = qIndex >= 0 ? url.substring(qIndex + 1) : '';

    return parse(search, options);
}

export function isObject(item: unknown) : item is Record<string, any> {
    return (
        !!item &&
        typeof item === 'object' &&
        !Array.isArray(item)
    );
}
