import type { Plugin } from 'routup';
import { createHandler } from './handler';
import type { ParseOptions } from './type';

export function query(options?: ParseOptions): Plugin {
    return {
        name: 'query',
        install: (router) => {
            router.use(createHandler(options));
        },
    };
}
