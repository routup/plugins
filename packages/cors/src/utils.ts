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
        preflightContinue: options.preflightContinue ?? false,
        preflight: { status: options.preflight?.status ?? 204 },
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

function testRegExp(pattern: RegExp, origin: string): boolean {
    const stateless = pattern.global || pattern.sticky ?
        new RegExp(pattern.source, pattern.flags.replace(/[gy]/g, '')) :
        pattern;
    return stateless.test(origin);
}

export function isCorsOriginAllowed(
    origin: string | null | undefined,
    options: Options = {},
): boolean {
    const { origin: originOption } = options;

    if (originOption === false) {
        return false;
    }

    if (!origin) {
        return false;
    }

    if (originOption === undefined || originOption === '*' || originOption === true) {
        return true;
    }

    if (typeof originOption === 'function') {
        return originOption(origin);
    }

    if (originOption instanceof RegExp) {
        return testRegExp(originOption, origin);
    }

    if (Array.isArray(originOption)) {
        return originOption.some((entry) => {
            if (entry instanceof RegExp) {
                return testRegExp(entry, origin);
            }

            return origin === entry;
        });
    }

    return originOption === origin;
}

export function createOriginHeaders(
    event: IRoutupEvent,
    options: Options = {},
): CorsHeaderEntry[] {
    const { origin: originOption } = options;

    if (originOption === false) {
        return [];
    }

    if (originOption === undefined || originOption === '*') {
        return [['access-control-allow-origin', '*']];
    }

    const requestOrigin = getRequestHeader(event, 'origin');

    if (originOption === true) {
        if (!requestOrigin) {
            return [];
        }
        return [
            ['access-control-allow-origin', requestOrigin],
            ['vary', 'origin'],
        ];
    }

    if (typeof originOption === 'string') {
        return [
            ['access-control-allow-origin', originOption],
            ['vary', 'origin'],
        ];
    }

    if (isCorsOriginAllowed(requestOrigin, options)) {
        return [
            ['access-control-allow-origin', requestOrigin as string],
            ['vary', 'origin'],
        ];
    }

    return [];
}

export function createMethodsHeaders(options: Options = {}): CorsHeaderEntry[] {
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

export function createCredentialsHeaders(options: Options = {}): CorsHeaderEntry[] {
    return options.credentials ?
        [['access-control-allow-credentials', 'true']] :
        [];
}

export function createAllowHeaderHeaders(
    event: IRoutupEvent,
    options: Options = {},
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

export function createExposeHeaders(options: Options = {}): CorsHeaderEntry[] {
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

export function createMaxAgeHeader(options: Options = {}): CorsHeaderEntry[] {
    const { maxAge } = options;
    if (maxAge === false || maxAge === undefined) {
        return [];
    }

    return [['access-control-max-age', String(maxAge)]];
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
