import { body } from '@routup/body';
import { cookie } from '@routup/cookie';
import { query } from '@routup/query';
import type { Plugin } from 'routup';
import type { Options } from './types';
import { boolToObject } from './utils';

export function basic(options: Options = {}) : Plugin {
    if (
        typeof options.body === 'undefined' &&
        typeof options.cookie === 'undefined' &&
        typeof options.query === 'undefined'
    ) {
        options.body = true;
        options.cookie = true;
        options.query = true;
    }

    return {
        name: 'basic',
        install: (router) => {
            if (options.body) {
                router.use(body(boolToObject(options.body)));
            }

            if (options.cookie) {
                router.use(cookie(boolToObject(options.cookie)));
            }

            if (options.query) {
                router.use(query(boolToObject(options.query)));
            }
        },
    };
}
