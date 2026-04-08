import type { Plugin } from 'routup';
import { createHandler } from './handler';
import type { Options } from './types';

/**
 * Body parsing plugin for routup.
 *
 * Registers a middleware that stores body parsing options on the event,
 * so that helper functions like `readRequestBody` can lazily parse and cache
 * the request body on first access.
 *
 * By default, `json` and `urlEncoded` parsing are enabled.
 *
 * @param options - Configure which body types to support and their limits.
 */
export function body(options: Options = {}): Plugin {
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
            router.use(createHandler(options));
        },
    };
}
