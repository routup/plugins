import type { IAppEvent } from 'routup';
import { parse } from 'qs';

import type { ParseOptions } from './type';

export function parseRequestQuery(event: IAppEvent, options?: ParseOptions) {
    const { url } = event.request;
    const qIndex = url.indexOf('?');
    if (qIndex < 0) {
        return parse('', options);
    }

    const hashIndex = url.indexOf('#', qIndex);
    const search = url.substring(qIndex + 1, hashIndex >= 0 ? hashIndex : undefined);

    return parse(search, options);
}

export function isObject(item: unknown) : item is Record<string, any> {
    return (
        !!item &&
        typeof item === 'object' &&
        !Array.isArray(item)
    );
}
