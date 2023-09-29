import * as console from 'console';
import {
    coreHandler,
    send,
    useRequestMountPath, useRequestPath,
} from 'routup';
import fs from 'node:fs';
import path from 'node:path';
import type {
    Handler,
} from 'routup';
import { createHandler } from '@routup/static';
import { URL } from 'node:url';
import type { Spec } from 'swagger-ui-dist';
import { ASSETS_PATH } from '../constants';
import type { UIOptions } from './type';
import { isFileURL } from './utils';
import {
    cleanDoubleSlashes,
    isObject,
    withLeadingSlash,
    withTrailingSlash,
    withoutLeadingSlash,
} from '../utils';

/* istanbul ignore next */
const stringify = (obj: Record<string, any>) => {
    const placeholder = '____FUNCTION_PLACEHOLDER____';
    const fns : CallableFunction[] = [];

    let json = JSON.stringify(obj, (key, value) => {
        if (typeof value === 'function') {
            fns.push(value);
            return placeholder;
        }

        return value;
    }, 2);

    json = json.replace(new RegExp(`"${placeholder}"`, 'g'), (_) => fns.shift() as any);

    return `var options = ${json};`;
};

/**
 * Create a swagger handler by swagger document or web url.
 *
 * @param document
 * @param options
 */
export function createUIHandler(
    document: Spec | string,
    options: UIOptions = {},
) : Handler {
    const handler = createHandler(path.dirname(require.resolve('swagger-ui-dist')), {
        extensions: [],
    });

    if (isObject(document)) {
        options.spec = document;
    } else if (isFileURL(document)) {
        const documentFile = fs.readFileSync(document, { encoding: 'utf-8' });
        options.spec = JSON.parse(documentFile);
    } else {
        options.url = document;
    }

    let template : string | undefined;
    const templateRaw = fs.readFileSync(path.join(ASSETS_PATH, 'template.tpl'), {
        encoding: 'utf-8',
    });

    const compileTemplate = (context: {url?: string, mountPath: string, path: string }) : void => {
        let href = '/';
        if (context.url) {
            let pathName : string;
            if (context.url.startsWith('http')) {
                pathName = new URL(context.url).pathname;
            } else {
                pathName = context.url;
            }

            const mountPathIndex = pathName.indexOf(context.path);
            if (mountPathIndex !== -1) {
                href = pathName.substring(0, mountPathIndex + context.path.length);
            } else {
                href = pathName;
            }

            if (options.baseURL) {
                href = new URL(withoutLeadingSlash(href), options.baseURL).href;
            } else if (options.basePath) {
                href = withLeadingSlash(cleanDoubleSlashes(`${options.basePath}/${href}`));
            }

            href = withTrailingSlash(href);
        } else if (options.baseURL) {
            href = withTrailingSlash(options.baseURL);
        } else if (options.basePath) {
            href = withTrailingSlash(withLeadingSlash(options.basePath));
        }

        template = templateRaw
            .replace('<% title %>', 'Swagger UI')
            .replace('<% swaggerOptions %>', stringify(options))
            .replace('<% baseHref %>', href);
    };

    return coreHandler((req, res, next) => {
        /* istanbul ignore next */
        if (typeof req.url === 'undefined') {
            next();
            return;
        }

        if (req.url.includes('/package.json')) {
            res.statusCode = 404;
            send(res);

            return;
        }

        handler.fn(req, res, async (err) => {
            if (typeof template === 'undefined') {
                compileTemplate({
                    url: req.url,
                    mountPath: useRequestMountPath(req),
                    path: useRequestPath(req),
                });
            }

            return send(res, template);
        });
    });
}
