import { compile } from './compile';
import type { Formatter, TokenMap } from './types';

export const formatStrings = {
    combined: ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"',
    common: ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length]',
    short: ':remote-addr :remote-user :method :url HTTP/:http-version :status :res[content-length] - :response-time ms',
    tiny: ':method :url :status :res[content-length] - :response-time ms',
} as const satisfies Record<string, string>;

export type PresetFormatName = keyof typeof formatStrings;

const ANSI_RESET = '\x1b[0m';
function ansi(code: number, text: string): string {
    return `\x1b[${code}m${text}${ANSI_RESET}`;
}

export const devFormatter: Formatter = (tokens: TokenMap, event, response) => {
    const status = response?.status;
    let color = 0;
    if (status) {
        if (status >= 500) {
            color = 31;
        } else if (status >= 400) {
            color = 33;
        } else if (status >= 300) {
            color = 36;
        } else if (status >= 200) {
            color = 32;
        }
    }

    const method = tokens.method?.(event, response) ?? '-';
    const url = tokens.url?.(event, response) ?? '-';
    const statusText = tokens.status?.(event, response) ?? '-';
    const responseTime = tokens['response-time']?.(event, response) ?? '-';
    const contentLength = tokens.res?.(event, response, 'content-length') ?? '-';

    return `${method} ${url} ${color ? ansi(color, statusText) : statusText} ${responseTime} ms - ${contentLength}`;
};

export function resolveFormat(format: unknown): Formatter {
    if (typeof format === 'function') {
        return format as Formatter;
    }

    if (typeof format !== 'string') {
        return compile(formatStrings.tiny);
    }

    if (format === 'dev') {
        return devFormatter;
    }

    if (format in formatStrings) {
        return compile(formatStrings[format as PresetFormatName]);
    }

    return compile(format);
}
