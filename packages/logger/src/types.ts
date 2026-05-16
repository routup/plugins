import type { IAppEvent } from 'routup';

export type Token = (
    event: IAppEvent,
    response: Response | undefined,
    arg?: string,
) => string | undefined;

export type TokenMap = Record<string, Token>;

export type Formatter = (
    tokens: TokenMap,
    event: IAppEvent,
    response: Response | undefined,
) => string | undefined;

export type FormatInput = string | Formatter;

export type SkipFn = (
    event: IAppEvent,
    response: Response | undefined,
) => boolean;

export type WriteFn = (line: string) => void;

export type Options = {
    /**
     * Format string (e.g. `':method :url :status'`), name of a preset
     * (`'tiny' | 'short' | 'common' | 'combined' | 'dev'`), or a custom
     * `Formatter` function.
     *
     * @default 'tiny'
     */
    format?: FormatInput;

    /**
     * Skip a request from being logged.
     */
    skip?: SkipFn;

    /**
     * Where to write the log line. Defaults to `console.log`.
     */
    write?: WriteFn;

    /**
     * Log immediately when the request starts instead of after the response is
     * resolved. The `:status` and `:response-time` tokens render as `-` in this
     * mode.
     *
     * @default false
     */
    immediate?: boolean;

    /**
     * Additional tokens to make available to the formatter. Merged on top of
     * the built-in tokens.
     */
    tokens?: TokenMap;
};
