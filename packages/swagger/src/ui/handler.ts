import {
    defineCoreHandler,
} from 'routup';
import type { Handler } from 'routup';
import fs from 'node:fs';
import path from 'node:path';
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
 * Create a swagger UI handler by swagger document or web url.
 *
 * @param document
 * @param options
 */
export function createUIHandler(
    document: Spec | string,
    options: UIOptions = {},
) : Handler {
    if (isObject(document)) {
        options.spec = document;
    } else if (isFileURL(document)) {
        const documentFile = fs.readFileSync(document, { encoding: 'utf-8' });
        options.spec = JSON.parse(documentFile);
    } else {
        options.url = document;
    }

    let template : string | undefined;
    const templateRaw = fs.readFileSync(path.join(ASSETS_PATH, 'template.tpl'), { encoding: 'utf-8' });

    const compileTemplate = (mountPath: string) : void => {
        let href = withTrailingSlash(mountPath || '/');

        if (options.baseURL) {
            href = withTrailingSlash(new URL(withoutLeadingSlash(href), options.baseURL).href);
        } else if (options.basePath) {
            href = withTrailingSlash(withLeadingSlash(cleanDoubleSlashes(`${options.basePath}/${href}`)));
        }

        template = templateRaw
            .replace('<% title %>', 'Swagger UI')
            .replace('<% swaggerOptions %>', stringify(options))
            .replace('<% baseHref %>', href);
    };

    return defineCoreHandler((event) => {
        if (event.path.includes('/package.json')) {
            event.response.status = 404;
            return null;
        }

        if (typeof template === 'undefined') {
            compileTemplate(event.mountPath);
        }

        event.response.headers.set('content-type', 'text/html; charset=utf-8');
        return template;
    });
}
