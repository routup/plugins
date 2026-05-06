import type { IRoutupEvent } from 'routup';
import { defineCoreHandler } from 'routup';
import type { Options } from './types';
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

export function appendCorsPreflightHeaders(event: IRoutupEvent, options: Options): void {
    const resolved = resolveOptions(options);
    applyHeaders(event, [
        ...createOriginHeaders(event, resolved),
        ...createCredentialsHeaders(resolved),
        ...createMethodsHeaders(resolved),
        ...createAllowHeaderHeaders(event, resolved),
        ...createMaxAgeHeader(resolved),
    ]);
}

export function appendCorsHeaders(event: IRoutupEvent, options: Options): void {
    const resolved = resolveOptions(options);
    applyHeaders(event, [
        ...createOriginHeaders(event, resolved),
        ...createCredentialsHeaders(resolved),
        ...createExposeHeaders(resolved),
    ]);
}

export function handleCors(event: IRoutupEvent, options: Options): Response | undefined {
    if (isPreflightRequest(event)) {
        appendCorsPreflightHeaders(event, options);
        const statusCode = options.preflight?.statusCode ?? 204;
        return new Response(null, {
            status: statusCode,
            headers: event.response.headers,
        });
    }

    appendCorsHeaders(event, options);
    return undefined;
}

export function createHandler(input?: Options) {
    const options = resolveOptions(input);

    if (options.credentials && (!input?.origin || input.origin === '*')) {
        // eslint-disable-next-line no-console
        console.warn(
            '[@routup/cors] `credentials: true` with wildcard origin is not allowed. Browsers will reject the response.',
        );
    }

    return defineCoreHandler((event) => {
        if (isPreflightRequest(event)) {
            appendCorsPreflightHeaders(event, options);
            return new Response(null, {
                status: options.preflight.statusCode,
                headers: event.response.headers,
            });
        }

        appendCorsHeaders(event, options);
        return event.next();
    });
}
