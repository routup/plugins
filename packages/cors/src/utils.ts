import type { IRoutupEvent } from 'routup';
import { appendResponseHeader, getRequestHeader } from 'routup';
import type {
    CorsHeaderEntry,
    Options,
    ResolvedOptions,
} from './types';

export function resolveOptions(options: Options = {}): ResolvedOptions {
    return {
        origin: options.origin ?? '*',
        methods: options.methods ?? '*',
        allowHeaders: options.allowHeaders ?? '*',
        exposeHeaders: options.exposeHeaders ?? '*',
        credentials: options.credentials ?? false,
        maxAge: options.maxAge ?? false,
        preflight: { statusCode: options.preflight?.statusCode ?? 204 },
    };
}

export function isPreflightRequest(event: IRoutupEvent): boolean {
    if (event.method !== 'OPTIONS') {
        return false;
    }

    const origin = getRequestHeader(event, 'origin');
    const acrm = getRequestHeader(event, 'access-control-request-method');

    return !!origin && !!acrm;
}

export function isCorsOriginAllowed(
    origin: string | null | undefined,
    options: Options,
): boolean {
    const { origin: originOption } = options;

    if (!origin) {
        return false;
    }

    if (!originOption || originOption === '*') {
        return true;
    }

    if (typeof originOption === 'function') {
        return originOption(origin);
    }

    if (Array.isArray(originOption)) {
        return originOption.some((entry) => {
            if (entry instanceof RegExp) {
                return entry.test(origin);
            }

            return origin === entry;
        });
    }

    return originOption === origin;
}

export function createOriginHeaders(
    event: IRoutupEvent,
    options: Options,
): CorsHeaderEntry[] {
    const { origin: originOption } = options;
    const origin = getRequestHeader(event, 'origin');

    if (!originOption || originOption === '*') {
        return [['access-control-allow-origin', '*']];
    }

    if (originOption === 'null') {
        return [
            ['access-control-allow-origin', 'null'],
            ['vary', 'origin'],
        ];
    }

    if (isCorsOriginAllowed(origin, options)) {
        return [
            ['access-control-allow-origin', origin as string],
            ['vary', 'origin'],
        ];
    }

    return [];
}

export function createMethodsHeaders(options: Options): CorsHeaderEntry[] {
    const { methods } = options;

    if (!methods) {
        return [];
    }

    if (methods === '*') {
        return [['access-control-allow-methods', '*']];
    }

    if (methods.length === 0) {
        return [];
    }

    return [['access-control-allow-methods', methods.join(',')]];
}

export function createCredentialsHeaders(options: Options): CorsHeaderEntry[] {
    return options.credentials ?
        [['access-control-allow-credentials', 'true']] :
        [];
}

export function createAllowHeaderHeaders(
    event: IRoutupEvent,
    options: Options,
): CorsHeaderEntry[] {
    const { allowHeaders } = options;

    if (!allowHeaders || allowHeaders === '*' || allowHeaders.length === 0) {
        const requested = getRequestHeader(event, 'access-control-request-headers');
        if (!requested) {
            return [];
        }

        return [
            ['access-control-allow-headers', requested],
            ['vary', 'access-control-request-headers'],
        ];
    }

    return [
        ['access-control-allow-headers', allowHeaders.join(',')],
        ['vary', 'access-control-request-headers'],
    ];
}

export function createExposeHeaders(options: Options): CorsHeaderEntry[] {
    const { exposeHeaders } = options;

    if (!exposeHeaders) {
        return [];
    }

    if (exposeHeaders === '*') {
        return [['access-control-expose-headers', '*']];
    }

    if (exposeHeaders.length === 0) {
        return [];
    }

    return [['access-control-expose-headers', exposeHeaders.join(',')]];
}

export function createMaxAgeHeader(options: Options): CorsHeaderEntry[] {
    return options.maxAge ?
        [['access-control-max-age', options.maxAge]] :
        [];
}

export function applyHeaders(event: IRoutupEvent, entries: CorsHeaderEntry[]): void {
    for (const [name, value] of entries) {
        if (name === 'vary') {
            appendResponseHeader(event, name, value);
        } else {
            event.response.headers.set(name, value);
        }
    }
}
