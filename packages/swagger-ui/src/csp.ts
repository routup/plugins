import type { Spec } from 'swagger-ui-dist';
import { isObject } from './object';
import type { ContentSecurityPolicyInput, UIOptions } from './types';

const DEFAULT_VALIDATOR_URL = 'https://validator.swagger.io/validator';

function unique(items: (string | undefined)[]) : string[] {
    return [...new Set(items.filter((item): item is string => !!item))];
}

function toOrigin(input: unknown) : string | undefined {
    if (typeof input !== 'string') {
        return undefined;
    }

    try {
        const url = new URL(input);

        if (url.protocol === 'http:' || url.protocol === 'https:') {
            return url.origin;
        }
    } catch {
        // relative url, covered by 'self'
    }

    return undefined;
}

/**
 * Build the recommended content security policy for the Swagger UI shell.
 *
 * The shell loads only same-origin scripts and styles, so no hash or
 * `'unsafe-inline'` is needed. `data:` images are used by swagger-ui.css,
 * `blob:` images and media by binary responses.
 */
export function buildContentSecurityPolicy(input: ContentSecurityPolicyInput = {}) : string {
    const self = unique(["'self'", ...(input.origins || [])]).join(' ');
    // blob: urls render binary "Try it out" responses (images, audio, video).
    const img = unique(["'self'", ...(input.origins || []), 'data:', 'blob:', ...(input.imgSrc || [])]).join(' ');
    const connect = unique(["'self'", ...(input.origins || []), ...(input.connectSrc || [])]).join(' ');

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
 * Replace `{name}` placeholders of a server url with the variable defaults.
 * A placeholder without default leaves the server unresolved (undefined).
 */
function expandServerURL(server: unknown) : string | undefined {
    if (!isObject(server) || typeof server.url !== 'string') {
        return undefined;
    }

    const variables = isObject(server.variables) ? server.variables : {};
    let unresolved = false;

    const url = server.url.replace(/\{([^}]+)\}/g, (_match, name: string) => {
        const variable = variables[name];

        if (isObject(variable) && typeof variable.default === 'string') {
            return variable.default;
        }

        unresolved = true;

        return '';
    });

    return unresolved ? undefined : url;
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
        output.push(toOrigin(expandServerURL(server)));
    }

    if (typeof spec.host === 'string' && spec.host.length > 0) {
        const schemes : unknown[] = Array.isArray(spec.schemes) ? spec.schemes : ['https', 'http'];

        for (const scheme of schemes) {
            output.push(toOrigin(`${scheme}://${spec.host}`));
        }
    }

    for (const scheme of collectSecuritySchemes(spec)) {
        output.push(toOrigin(scheme.tokenUrl), toOrigin(scheme.openIdConnectUrl));

        if (isObject(scheme.flows)) {
            for (const flow of Object.values(scheme.flows)) {
                if (isObject(flow)) {
                    output.push(toOrigin(flow.tokenUrl), toOrigin(flow.refreshUrl));
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
    const connectSrc = [toOrigin(options.url), toOrigin(options.configUrl)];

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
        imgSrc.push(toOrigin(options.validatorUrl || DEFAULT_VALIDATOR_URL));
    }

    return {
        origins: unique([toOrigin(options.baseURL)]),
        connectSrc: unique(connectSrc),
        imgSrc: unique(imgSrc),
    };
}
