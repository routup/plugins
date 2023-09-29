import type { Plugin } from 'routup';
import { createHandler } from './handler';
import type { Options } from './types';

export function cookie(options: Options = {}) : Plugin {
    return {
        name: 'cookie',
        install: (router) => {
            router.use(createHandler(options.parse));
        },
    };
}
