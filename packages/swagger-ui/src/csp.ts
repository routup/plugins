import type { Spec } from 'swagger-ui-dist';
import { isObject } from './object';
import type { ContentSecurityPolicyInput, UIOptions } from './types';

const DEFAULT_VALIDATOR_URL = 'https://validator.swagger.io/validator';

function unique(items: (string | undefined)[]) : string[] {
    return [...new Set(items.filter((item): item is string => !!item))];
}

/**
 * scheme, host (letters, digits, `.`, `-` or a bracketed IPv6 address)
 * and optional port: nothing that could end a directive (`;`) or a
 * policy (`,`) in the header.
 */
const HOST_SOURCE_RE = /^https?:\/\/(?:[a-z0-9.-]+|\[[0-9a-f:.]+\])(?::\d+)?$/i;

function toOrigins(input: unknown) : string[] {
    if (typeof input !== 'string') {
        return [];
    }

    // protocol-relative: the scheme of the page decides.
    if (input.startsWith('//')) {
        return [...toOrigins(`https:${input}`), ...toOrigins(`http:${input}`)];
    }

    try {
        const { origin } = new URL(input);

        if (HOST_SOURCE_RE.test(origin)) {
            return [origin];
        }
    } catch {
        // relative url, covered by 'self'
    }

    return [];
}

// Characters that end a source (whitespace), a directive (`;`) or a policy (`,`).
const UNSAFE_SOURCE_RE = /[\s;,]/;

function isUnsafeSource(source: string) : boolean {
    return UNSAFE_SOURCE_RE.test(source) ||
        [...source].some((char) => char.charCodeAt(0) < 0x20 || char.charCodeAt(0) === 0x7f);
}

function assertSources(name: string, sources: string[] = []) : string[] {
    for (const source of sources) {
        if (typeof source !== 'string' || source.length === 0 || isUnsafeSource(source)) {
            throw new Error(`Invalid content security policy source in ${name}: ${JSON.stringify(source)}`);
        }
    }

    return sources;
}

/**
 * Build the recommended content security policy for the Swagger UI shell.
 *
 * The shell loads only same-origin scripts and styles, so no hash or
 * `'unsafe-inline'` is needed. `data:` images are used by swagger-ui.css,
 * `blob:` images and media by binary responses.
 */
export function buildContentSecurityPolicy(input: ContentSecurityPolicyInput = {}) : string {
    const origins = assertSources('origins', input.origins);
    const imgSrc = assertSources('imgSrc', input.imgSrc);
    const connectSrc = assertSources('connectSrc', input.connectSrc);

    const self = unique(["'self'", ...origins]).join(' ');
    // blob: urls render binary "Try it out" responses (images, audio, video).
    const img = unique(["'self'", ...origins, 'data:', 'blob:', ...imgSrc]).join(' ');
    const connect = unique(["'self'", ...origins, ...connectSrc]).join(' ');

    return [
        `default-src ${self}`,
        `script-src ${self}`,
        `style-src ${self}`,
        `img-src ${img}`,
        `media-src ${self} blob:`,
        `font-src ${self} data:`,
        `connect-src ${connect}`,
        "object-src 'none'",
        `base-uri ${self}`,
        `form-action ${self}`,
    ].join('; ');
}

function collectSecuritySchemes(spec: Spec) : Record<string, any>[] {
    const output : Record<string, any>[] = [];
    const containers = [spec.securityDefinitions, spec.components?.securitySchemes];

    for (const container of containers) {
        if (!isObject(container)) {
            continue;
        }

        for (const scheme of Object.values(container)) {
            if (isObject(scheme)) {
                output.push(scheme);
            }
        }
    }

    return output;
}

/**
 * Does the inline document declare an OAuth2 or OpenID Connect scheme?
 */
export function hasOAuthScheme(spec: unknown) : boolean {
    if (!isObject(spec)) {
        return false;
    }

    return collectSecuritySchemes(spec)
        .some((scheme) => scheme.type === 'oauth2' || scheme.type === 'openIdConnect');
}

/**
 * Upper bound of urls a templated server expands to; beyond it the
 * server is skipped and needs a string policy.
 */
const MAX_SERVER_URLS = 64;

function toVariableValues(variable: unknown) : string[] {
    if (!isObject(variable)) {
        return [];
    }

    const values = [variable.default, ...(Array.isArray(variable.enum) ? variable.enum : [])]
        .filter((value) => typeof value === 'string' || typeof value === 'number')
        .map((value) => `${value}`);

    return [...new Set(values)];
}

/**
 * Expand the `{name}` placeholders of a server url with every value
 * a visitor can pick (the default and the `enum` values).
 * A placeholder without value or more than MAX_SERVER_URLS
 * combinations leave the server unresolved (empty).
 */
function expandServerURLs(server: unknown) : string[] {
    if (!isObject(server) || typeof server.url !== 'string') {
        return [];
    }

    const variables = isObject(server.variables) ? server.variables : {};
    const parts = server.url.split(/\{([^}]+)\}/g);

    let urls = [''];

    for (const [i, part] of parts.entries()) {
        const values = i % 2 === 0 ? [part] : toVariableValues(variables[part]);

        if (values.length === 0 || urls.length * values.length > MAX_SERVER_URLS) {
            return [];
        }

        urls = urls.flatMap((url) => values.map((value) => url + value));
    }

    return urls;
}

const HTTP_METHODS = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'];

/**
 * Collect the `servers` lists of the document root, its Path Items
 * and their Operations (OpenAPI 3 lets the latter two override the root).
 */
function collectServers(spec: Spec) : unknown[] {
    const output : unknown[] = [];

    const push = (container: unknown) => {
        if (isObject(container) && Array.isArray(container.servers)) {
            output.push(...container.servers);
        }
    };

    push(spec);

    if (isObject(spec.paths)) {
        for (const pathItem of Object.values(spec.paths)) {
            if (!isObject(pathItem)) {
                continue;
            }

            push(pathItem);

            for (const method of HTTP_METHODS) {
                push(pathItem[method]);
            }
        }
    }

    return output;
}

function collectSpecOrigins(spec: Spec) : string[] {
    const output : (string | undefined)[] = [];

    for (const server of collectServers(spec)) {
        for (const url of expandServerURLs(server)) {
            output.push(...toOrigins(url));
        }
    }

    if (typeof spec.host === 'string' && spec.host.length > 0) {
        const schemes : unknown[] = Array.isArray(spec.schemes) ? spec.schemes : ['https', 'http'];

        for (const scheme of schemes) {
            output.push(...toOrigins(`${scheme}://${spec.host}`));
        }
    }

    for (const scheme of collectSecuritySchemes(spec)) {
        output.push(...toOrigins(scheme.tokenUrl), ...toOrigins(scheme.openIdConnectUrl));

        if (isObject(scheme.flows)) {
            for (const flow of Object.values(scheme.flows)) {
                if (isObject(flow)) {
                    output.push(...toOrigins(flow.tokenUrl), ...toOrigins(flow.refreshUrl));
                }
            }
        }
    }

    return unique(output);
}

/**
 * Derive the extra policy sources a Swagger UI instance needs
 * from its options (spec url, servers, token endpoints, validator).
 */
export function buildContentSecurityPolicyInput(options: UIOptions) : ContentSecurityPolicyInput {
    const connectSrc = [...toOrigins(options.url), ...toOrigins(options.configUrl)];

    if (Array.isArray(options.urls)) {
        for (const entry of options.urls) {
            if (isObject(entry)) {
                connectSrc.push(...toOrigins(entry.url));
            }
        }
    }

    if (isObject(options.spec)) {
        connectSrc.push(...collectSpecOrigins(options.spec));
    }

    const imgSrc : (string | undefined)[] = [];

    // The validator badge is part of the standalone layout and only
    // rendered for documents loaded by url.
    if (
        options.url &&
        options.layout === 'StandaloneLayout' &&
        options.validatorUrl !== null &&
        options.validatorUrl !== 'none'
    ) {
        imgSrc.push(...toOrigins(options.validatorUrl || DEFAULT_VALIDATOR_URL));
    }

    return {
        origins: unique(toOrigins(options.baseURL)),
        connectSrc: unique(connectSrc),
        imgSrc: unique(imgSrc),
    };
}
