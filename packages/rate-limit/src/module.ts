import type { Plugin } from 'routup';
import { createHandler } from './handler';
import type { OptionsInput } from './type';

export function rateLimit(options?: OptionsInput) : Plugin {
    return {
        name: 'rateLimit',
        install: (router) => {
            router.use(createHandler(options));
        },
    };
}
