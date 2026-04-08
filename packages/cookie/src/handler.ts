import {
    defineCoreHandler,
} from 'routup';

import {
    hasRequestCookies,
    setRequestCookies,
} from './request';

import type { ParseOptions } from './types';
import { parseRequestCookies } from './utils';

export function createHandler(options?: ParseOptions) {
    return defineCoreHandler((event) => {
        if (hasRequestCookies(event)) {
            return event.next();
        }

        setRequestCookies(event, parseRequestCookies(event, options));

        return event.next();
    });
}
