import type { Plugin } from 'routup';
import { createHandler } from './handler';
import type { OptionsInput } from './type';

export function assets(
    directory: string,
    options?: OptionsInput,
) : Plugin {
    return {
        name: 'assets',
        install: (router) => {
            router.use(createHandler(directory, options));
        },
    };
}
