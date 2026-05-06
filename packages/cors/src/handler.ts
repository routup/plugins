import type { IRoutupEvent } from 'routup';
import { defineCoreHandler } from 'routup';
import type { Options, ResolvedOptions } from './types';
import {
    applyHeaders,
    createAllowHeaderHeaders,
    createCredentialsHeaders,
    createExposeHeaders,
    createMaxAgeHeader,
    createMethodsHeaders,
    createOriginHeaders,
    isPreflightRequest,
    resolveOptions,
} from './utils';

function applyResolvedCorsPreflightHeaders(event: IRoutupEvent, resolved: ResolvedOptions): void {
    applyHeaders(event, [
        ...createOriginHeaders(event, resolved),
        ...createCredentialsHeaders(resolved),
        ...createMethodsHeaders(resolved),
        ...createAllowHeaderHeaders(event, resolved),
        ...createMaxAgeHeader(resolved),
    ]);
}

function applyResolvedCorsHeaders(event: IRoutupEvent, resolved: ResolvedOptions): void {
    applyHeaders(event, [
        ...createOriginHeaders(event, resolved),
        ...createCredentialsHeaders(resolved),
        ...createExposeHeaders(resolved),
    ]);
}

export function appendCorsPreflightHeaders(event: IRoutupEvent, options: Options): void {
    applyResolvedCorsPreflightHeaders(event, resolveOptions(options));
}

export function appendCorsHeaders(event: IRoutupEvent, options: Options): void {
    applyResolvedCorsHeaders(event, resolveOptions(options));
}

export function handleCors(event: IRoutupEvent, options: Options): Response | undefined {
    const resolved = resolveOptions(options);
    if (isPreflightRequest(event)) {
        applyResolvedCorsPreflightHeaders(event, resolved);
        return new Response(null, {
            status: resolved.preflight.statusCode,
            headers: event.response.headers,
        });
    }

    applyResolvedCorsHeaders(event, resolved);
    return undefined;
}

function warnInvalidCredentialsCombination(input: Options, resolved: ResolvedOptions): void {
    if (!resolved.credentials) {
        return;
    }

    const wildcardFields: string[] = [];
    if (!input.origin || input.origin === '*') {
        wildcardFields.push('origin');
    }
    if (resolved.methods === '*') {
        wildcardFields.push('methods');
    }
    if (resolved.allowHeaders === '*') {
        wildcardFields.push('allowHeaders');
    }
    if (resolved.exposeHeaders === '*') {
        wildcardFields.push('exposeHeaders');
    }

    if (wildcardFields.length > 0) {
        // eslint-disable-next-line no-console
        console.warn(
            `[@routup/cors] credentials: true cannot be combined with '*' for ${wildcardFields.join(', ')}. Browsers will reject the response.`,
        );
    }
}

export function createHandler(input?: Options) {
    const options = resolveOptions(input);

    warnInvalidCredentialsCombination(input ?? {}, options);

    return defineCoreHandler((event) => {
        if (isPreflightRequest(event)) {
            applyResolvedCorsPreflightHeaders(event, options);
            return new Response(null, {
                status: options.preflight.statusCode,
                headers: event.response.headers,
            });
        }

        applyResolvedCorsHeaders(event, options);
        return event.next();
    });
}
