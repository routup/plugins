import type { Plugin } from 'routup';
import { createHandler } from './handler';
import type { Options } from './type';

export function query(options: Options = {}): Plugin {
    return {
        name: 'query',
        install: (router) => {
            router.use(createHandler(options.parse));
        },
    };
}
