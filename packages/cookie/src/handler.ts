import type { Handler } from 'routup';
import {
    hasRequestCookies,
    setRequestCookies,
} from 'routup';

import type { ParseOptions } from './type';
import { parseRequestCookies } from './utils';

export function createHandler(options?: ParseOptions) : Handler {
    return (req, res, next) => {
        if (hasRequestCookies(req)) {
            next();
            return;
        }

        setRequestCookies(req, parseRequestCookies(req, options));

        next();
    };
}
