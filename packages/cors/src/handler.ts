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

function buildPreflightResponse(event: IRoutupEvent, resolved: ResolvedOptions): Response {
    const headers = new Headers(event.response.headers);
    headers.set('content-length', '0');
    return new Response(null, {
        status: resolved.preflight.status,
        headers,
    });
}

export function appendCorsPreflightHeaders(event: IRoutupEvent, options: Options): void {
    applyResolvedCorsPreflightHeaders(event, resolveOptions(options));
}

export function appendCorsHeaders(event: IRoutupEvent, options: Options): void {
    applyResolvedCorsHeaders(event, resolveOptions(options));
}

export function handleCors(event: IRoutupEvent, options: Options): Response | undefined {
    const resolved = resolveOptions(options);
    if (resolved.origin === false) {
        return undefined;
    }

    if (isPreflightRequest(event)) {
        applyResolvedCorsPreflightHeaders(event, resolved);
        if (resolved.preflightContinue) {
            return undefined;
        }
        return buildPreflightResponse(event, resolved);
    }

    applyResolvedCorsHeaders(event, resolved);
    return undefined;
}

function warnInvalidCredentialsCombination(input: Options, resolved: ResolvedOptions): void {
    if (!resolved.credentials) {
        return;
    }

    const wildcardFields: string[] = [];
    if (input.origin === undefined || input.origin === '*') {
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
        if (options.origin === false) {
            return event.next();
        }

        if (isPreflightRequest(event)) {
            applyResolvedCorsPreflightHeaders(event, options);
            if (options.preflightContinue) {
                return event.next();
            }
            return buildPreflightResponse(event, options);
        }

        applyResolvedCorsHeaders(event, options);
        return event.next();
    });
}
