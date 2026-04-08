import { defineCoreHandler } from 'routup';
import { hasRequestQuery, setRequestQuery } from './request';
import type { ParseOptions } from './type';
import { parseRequestQuery } from './utils';

export function createHandler(options?: ParseOptions) {
    return defineCoreHandler((event) => {
        if (hasRequestQuery(event)) {
            return event.next();
        }

        setRequestQuery(event, parseRequestQuery(event, options));

        return event.next();
    });
}
