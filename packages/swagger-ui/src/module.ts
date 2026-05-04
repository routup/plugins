import type { Plugin } from 'routup';
import type { Spec } from 'swagger-ui-dist';
import { createUIHandler } from './handler';
import type { UIOptions } from './type';

export function swaggerUI(
    document: Spec | string,
    options: UIOptions = {},
) : Plugin {
    return {
        name: 'swaggerUI',
        install: (router) => {
            router.use(createUIHandler(document, options));
        },
    };
}
