import { getRequestHeader, getRequestIP } from 'routup';
import type { Token, TokenMap } from './types';

const CLF_MONTH = [
    'Jan', 
    'Feb', 
    'Mar', 
    'Apr', 
    'May', 
    'Jun',
    'Jul', 
    'Aug', 
    'Sep', 
    'Oct', 
    'Nov', 
    'Dec',
];

function pad2(n: number): string {
    return n < 10 ? `0${n}` : `${n}`;
}

function clfDate(date: Date): string {
    const day = pad2(date.getUTCDate());
    const month = CLF_MONTH[date.getUTCMonth()];
    const year = date.getUTCFullYear();
    const hh = pad2(date.getUTCHours());
    const mm = pad2(date.getUTCMinutes());
    const ss = pad2(date.getUTCSeconds());
    return `${day}/${month}/${year}:${hh}:${mm}:${ss} +0000`;
}

const URL_TOKEN: Token = (event) => {
    const { url } = event.request;
    try {
        const parsed = new URL(url);
        return parsed.pathname + parsed.search;
    } catch {
        return url;
    }
};

const METHOD_TOKEN: Token = (event) => event.method;

const STATUS_TOKEN: Token = (event, response) => (response ?
    String(response.status) :
    undefined);

const DATE_TOKEN: Token = (event, response, format = 'web') => {
    const date = new Date();
    switch (format) {
        case 'clf':
            return clfDate(date);
        case 'iso':
            return date.toISOString();
        case 'web':
        default:
            return date.toUTCString();
    }
};

const REFERRER_TOKEN: Token = (event) => getRequestHeader(event, 'referer') ??
    getRequestHeader(event, 'referrer') ??
    undefined;

const REMOTE_ADDR_TOKEN: Token = (event) => getRequestIP(event) ?? undefined;

const USER_AGENT_TOKEN: Token = (event) => getRequestHeader(event, 'user-agent') ?? undefined;

const HTTP_VERSION_TOKEN: Token = (event) => {
    const protocol = (event.request as unknown as { httpVersion?: string }).httpVersion;
    return protocol ?? '1.1';
};

const REQ_HEADER_TOKEN: Token = (event, response, field) => {
    if (!field) {
        return undefined;
    }

    return getRequestHeader(event, field) ?? undefined;
};

const RES_HEADER_TOKEN: Token = (event, response, field) => {
    if (!response || !field) {
        return undefined;
    }

    return response.headers.get(field) ?? undefined;
};

const RESPONSE_TIME_TOKEN: Token = (event, response, digits = '3') => {
    const start = (event.store as Record<string | symbol, unknown>)[StartTimeSymbol];
    if (typeof start !== 'number') {
        return undefined;
    }

    const ms = performance.now() - start;
    return ms.toFixed(Number.parseInt(digits, 10));
};

const PID_TOKEN: Token = () => String(typeof process !== 'undefined' ? process.pid : 0);

const REMOTE_USER_TOKEN: Token = (event) => {
    const auth = getRequestHeader(event, 'authorization');
    if (!auth || !auth.toLowerCase().startsWith('basic ')) {
        return undefined;
    }
    try {
        const decoded = atob(auth.slice(6).trim());
        const idx = decoded.indexOf(':');
        return idx >= 0 ? decoded.slice(0, idx) : decoded;
    } catch {
        return undefined;
    }
};

export const StartTimeSymbol = Symbol.for('@routup/logger:startTime');

export const defaultTokens: TokenMap = {
    'url': URL_TOKEN,
    'method': METHOD_TOKEN,
    'status': STATUS_TOKEN,
    'date': DATE_TOKEN,
    'referrer': REFERRER_TOKEN,
    'remote-addr': REMOTE_ADDR_TOKEN,
    'remote-user': REMOTE_USER_TOKEN,
    'user-agent': USER_AGENT_TOKEN,
    'http-version': HTTP_VERSION_TOKEN,
    'req': REQ_HEADER_TOKEN,
    'res': RES_HEADER_TOKEN,
    'response-time': RESPONSE_TIME_TOKEN,
    'total-time': RESPONSE_TIME_TOKEN,
    'pid': PID_TOKEN,
};
