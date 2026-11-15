import { createCoreHandler } from '@routup/assets';
import {
    MethodName,
    defineCoreHandler,
} from 'routup';
import type { Handler, IAppEvent } from 'routup';
import fs from 'node:fs';
import path from 'node:path';
import { URL } from 'node:url';
import type { Spec } from 'swagger-ui-dist';
import { ASSETS_PATH } from './constants';
import { buildContentSecurityPolicy, buildContentSecurityPolicyInput, hasOAuthScheme } from './csp';
import { isObject } from './object';
import { escapeHTML, serializeOptions } from './serialize';
import type { UIOptions } from './types';
import {
    cleanDoubleSlashes,
    withLeadingSlash,
    withTrailingSlash,
} from './url';
import { isFileURL } from './utils';

/**
 * Files of swagger-ui-dist the shell references.
 * Everything else in the package (README, LICENSE, source maps,
 * the petstore index.html/swagger-initializer.js, ...) is not served.
 */
const DIST_FILES = [
    '/swagger-ui.css',
    '/swagger-ui-bundle.js',
    '/swagger-ui-standalone-preset.js',
    '/favicon-16x16.png',
    '/favicon-32x32.png',
];

const DIST_OAUTH_FILES = [
    '/oauth2-redirect.html',
    '/oauth2-redirect.js',
];

const SHELL_PATHS = ['/', '/index.html'];

function readAsset(name: string) : string {
    return fs.readFileSync(path.join(ASSETS_PATH, name), { encoding: 'utf-8' });
}

function getRelativePath(event: IAppEvent) : string {
    let requestPath = event.path;

    if (requestPath.startsWith(event.mountPath)) {
        requestPath = requestPath.substring(event.mountPath.length);
    }

    return withLeadingSlash(requestPath);
}

/**
 * Parse baseURL once; a path prefix without trailing slash
 * (`https://x/prefix`) is kept as a directory (`https://x/prefix/`).
 */
function normalizeBaseURL(input: string) : string {
    let url : URL;

    try {
        url = new URL(input);
    } catch {
        throw new Error(`The swagger-ui baseURL option must be an absolute http(s) URL, got ${JSON.stringify(input)}.`);
    }

    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        throw new Error(`The swagger-ui baseURL option must be an absolute http(s) URL, got ${JSON.stringify(input)}.`);
    }

    url.pathname = withTrailingSlash(url.pathname);
    url.search = '';
    url.hash = '';

    return url.href;
}

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
    const {
        baseURL: baseURLInput,
        basePath,
        csp,
        ...swaggerOptions
    } = options;

    const baseURL = typeof baseURLInput === 'string' ?
        normalizeBaseURL(baseURLInput) :
        undefined;

    if (isObject(document)) {
        swaggerOptions.spec = document;
    } else if (isFileURL(document)) {
        const documentFile = fs.readFileSync(document, { encoding: 'utf-8' });

        swaggerOptions.spec = JSON.parse(documentFile);
    } else {
        swaggerOptions.url = document;
    }

    let policy : string | undefined;

    if (typeof csp === 'string') {
        policy = csp;
    } else if (csp) {
        policy = buildContentSecurityPolicy(buildContentSecurityPolicyInput({ ...swaggerOptions, baseURL }));
    }

    const distFiles = new Set(DIST_FILES);

    if (
        swaggerOptions.oauth ||
        swaggerOptions.oauth2RedirectUrl ||
        hasOAuthScheme(swaggerOptions.spec)
    ) {
        DIST_OAUTH_FILES.forEach((file) => distFiles.add(file));
    }

    const shell = readAsset('template.tpl')
        .replace('<% title %>', () => 'Swagger UI');
    const initializer = readAsset('swagger-initializer.tpl')
        .replace('<% swaggerOptions %>', () => serializeOptions(swaggerOptions));
    const stylesheet = readAsset('index.css');

    const buildBaseHref = (mountPath: string) : string => {
        const href = withTrailingSlash(mountPath || '/');

        if (baseURL) {
            // relative to baseURL, so its path prefix is kept (also for the root mount).
            return withTrailingSlash(new URL(href.substring(1), baseURL).href);
        }

        if (basePath) {
            return withTrailingSlash(withLeadingSlash(cleanDoubleSlashes(`${basePath}/${href}`)));
        }

        return href;
    };

    const distHandler = createCoreHandler(
        path.dirname(require.resolve('swagger-ui-dist')),
        {
            extensions: [],
            scan: false,
            fallthrough: true,
        },
    );

    return defineCoreHandler(async (event) => {
        if (
            event.method !== MethodName.GET &&
            event.method !== MethodName.HEAD
        ) {
            return event.next();
        }

        const relativePath = getRelativePath(event);

        let output : string | undefined;
        let contentType : string | undefined;

        if (SHELL_PATHS.includes(relativePath)) {
            // Computed per request: the mount path may differ in casing or params.
            output = shell.replace('<% baseHref %>', () => escapeHTML(buildBaseHref(event.mountPath)));
            contentType = 'text/html; charset=utf-8';
        } else if (relativePath === '/swagger-initializer.js') {
            output = initializer;
            contentType = 'text/javascript; charset=utf-8';
        } else if (relativePath === '/index.css') {
            output = stylesheet;
            contentType = 'text/css; charset=utf-8';
        } else if (!distFiles.has(relativePath)) {
            return event.next();
        }

        // Set before the response is built, so a 304 carries it as well.
        if (policy) {
            event.response.headers.set('content-security-policy', policy);
        }

        if (typeof output === 'undefined') {
            return distHandler(event);
        }

        event.response.headers.set('content-type', contentType!);

        return output;
    });
}
