import type { IAppEvent } from 'routup';
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

function applyResolvedCorsPreflightHeaders(event: IAppEvent, resolved: ResolvedOptions): void {
    applyHeaders(event, [
        ...createOriginHeaders(event, resolved),
        ...createCredentialsHeaders(resolved),
        ...createMethodsHeaders(resolved),
        ...createAllowHeaderHeaders(event, resolved),
        ...createMaxAgeHeader(resolved),
    ]);
}

function applyResolvedCorsHeaders(event: IAppEvent, resolved: ResolvedOptions): void {
    applyHeaders(event, [
        ...createOriginHeaders(event, resolved),
        ...createCredentialsHeaders(resolved),
        ...createExposeHeaders(resolved),
    ]);
}

function buildPreflightResponse(event: IAppEvent, resolved: ResolvedOptions): Response {
    const headers = new Headers(event.response.headers);
    headers.set('content-length', '0');
    return new Response(null, {
        status: resolved.preflight.status,
        headers,
    });
}

export function appendCorsPreflightHeaders(event: IAppEvent, options: Options): void {
    applyResolvedCorsPreflightHeaders(event, resolveOptions(options));
}

export function appendCorsHeaders(event: IAppEvent, options: Options): void {
    applyResolvedCorsHeaders(event, resolveOptions(options));
}

export function handleCors(event: IAppEvent, options: Options): Response | undefined {
    const resolved = resolveOptions(options);
    if (resolved.origin === false) {
        return undefined;
    }

    if (isPreflightRequest(event)) {
        applyResolvedCorsPreflightHeaders(event, resolved);
        if (resolved.preflight.continue) {
            return undefined;
        }
        return buildPreflightResponse(event, resolved);
    }

    applyResolvedCorsHeaders(event, resolved);
    return undefined;
}

function warnInvalidCredentialsCombination(resolved: ResolvedOptions): void {
    if (!resolved.credentials) {
        return;
    }

    if (resolved.origin === '*') {
        // eslint-disable-next-line no-console
        console.warn(
            '[@routup/cors] credentials: true cannot be combined with \'*\' for origin. The browser will block the request. Use `origin: true` to reflect the request origin instead.',
        );
    }

    if (resolved.exposeHeaders === '*') {
        // eslint-disable-next-line no-console
        console.warn(
            '[@routup/cors] credentials: true cannot be combined with \'*\' for exposeHeaders. The response is not rejected, but custom response headers will not be exposed to JavaScript.',
        );
    }
}

export function createHandler(input?: Options) {
    const options = resolveOptions(input);

    warnInvalidCredentialsCombination(options);

    return defineCoreHandler((event) => {
        if (options.origin === false) {
            return event.next();
        }

        if (isPreflightRequest(event)) {
            applyResolvedCorsPreflightHeaders(event, options);
            if (options.preflight.continue) {
                return event.next();
            }
            return buildPreflightResponse(event, options);
        }

        applyResolvedCorsHeaders(event, options);
        return event.next();
    });
}
