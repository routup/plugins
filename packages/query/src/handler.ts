import { coreHandler } from 'routup';
import { hasRequestQuery, setRequestQuery } from './request';
import type { ParseOptions } from './type';
import { parseRequestQuery } from './utils';

export function createHandler(options?: ParseOptions) {
    return coreHandler((req, res, next) => {
        if (hasRequestQuery(req)) {
            next();

            return;
        }

        setRequestQuery(req, parseRequestQuery(req, options));
        next();
    });
}
