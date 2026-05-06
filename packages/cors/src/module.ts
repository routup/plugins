import type { Plugin } from 'routup';
import { createHandler } from './handler';
import type { Options } from './types';

export function cors(options: Options = {}): Plugin {
    return {
        name: 'cors',
        install: (router) => {
            router.use(createHandler(options));
        },
    };
}
