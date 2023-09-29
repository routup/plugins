import type { Plugin } from 'routup';
import {
    createJsonHandler,
    createRawHandler,
    createTextHandler,
    createUrlEncodedHandler,
} from './parser';
import type { Options } from './types';
import { boolToObject } from './utils';

export function body(options : Options = {}) : Plugin {
    if (
        typeof options.json === 'undefined' &&
        typeof options.raw === 'undefined' &&
        typeof options.urlEncoded === 'undefined' &&
        typeof options.text === 'undefined'
    ) {
        options.json = true;
        options.urlEncoded = true;
    }

    return {
        name: 'body',
        install: (router) => {
            if (options.json) {
                router.use(createJsonHandler(boolToObject(options.json)));
            }

            if (options.raw) {
                router.use(createRawHandler(boolToObject(options.raw)));
            }

            if (options.text) {
                router.use(createTextHandler(boolToObject(options.text)));
            }

            if (options.urlEncoded) {
                router.use(createUrlEncodedHandler(boolToObject(options.urlEncoded)));
            }
        },
    };
}
