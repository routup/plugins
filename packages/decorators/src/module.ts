import type { Plugin } from 'routup';
import { mountControllers } from './mount';
import type { Options } from './type';

export function decorators(options: Options) : Plugin {
    return {
        name: 'decorators',
        install: (router) => {
            mountControllers(router, options.controllers);
        },
    };
}
