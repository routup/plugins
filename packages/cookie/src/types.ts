import type {
    CookieParseOptions,
    CookieSerializeOptions,
} from 'cookie-es';

export type ParseOptions = CookieParseOptions;
export type SerializeOptions = CookieSerializeOptions;

export type Options = {
    parse?: ParseOptions,
    serialize?: SerializeOptions
};
