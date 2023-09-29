import type { Plugin } from 'routup';
import type { Spec } from 'swagger-ui-dist';
import { createUIHandler } from './handler';
import type { UIOptions } from './type';

export function ui(
    document: Spec | string,
    options: UIOptions = {},
) : Plugin {
    return {
        name: 'swagger',
        install: (router) => {
            router.use(createUIHandler(document, options));
        },
    };
}
