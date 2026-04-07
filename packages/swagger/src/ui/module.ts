import path from 'node:path';
import type { Plugin } from 'routup';
import type { Spec } from 'swagger-ui-dist';
import { createHandler as createAssetsHandler } from '@routup/assets';
import { createUIHandler } from './handler';
import type { UIOptions } from './type';

export function swaggerUI(
    document: Spec | string,
    options: UIOptions = {},
) : Plugin {
    return {
        name: 'swaggerUI',
        install: (router) => {
            router.use(createAssetsHandler(
                path.dirname(require.resolve('swagger-ui-dist')),
                {
                    extensions: [],
                    scan: false,
                    ignores: [/package\.json/],
                },
            ));
            router.use(createUIHandler(document, options));
        },
    };
}
