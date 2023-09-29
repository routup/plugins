import type { Handler } from 'routup';
import {
    coreHandler,
    hasRequestCookies,
    setRequestCookies,
} from 'routup';

import type { ParseOptions } from './types';
import { parseRequestCookies } from './utils';

export function createHandler(options?: ParseOptions) {
    return coreHandler((req, res, next) => {
        if (hasRequestCookies(req)) {
            next();
            return;
        }

        setRequestCookies(req, parseRequestCookies(req, options));

        next();
    });
}
