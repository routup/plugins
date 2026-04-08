export type LimitOptions = {
    /**
     * Maximum body size. Can be a number (bytes) or a string like '100kb', '1mb'.
     *
     * @default '100kb'
     */
    limit?: number | string;
};

export type JsonOptions = LimitOptions & {
    /**
     * Only accept arrays and objects. When false, accepts anything JSON.parse accepts.
     *
     * @default true
     */
    strict?: boolean;

    /**
     * A reviver function passed to JSON.parse.
     */
    reviver?: (key: string, value: unknown) => unknown;

    /**
     * Content-types to parse.
     *
     * @default 'application/json'
     */
    type?: string | string[];
};

export type UrlEncodedOptions = LimitOptions & {
    /**
     * Content-types to parse.
     *
     * @default 'application/x-www-form-urlencoded'
     */
    type?: string | string[];

    /**
     * Maximum number of parameters.
     *
     * @default 1000
     */
    parameterLimit?: number;
};

export type TextOptions = LimitOptions & {
    /**
     * Content-types to parse.
     *
     * @default 'text/plain'
     */
    type?: string | string[];

    /**
     * Default charset if not specified in content-type.
     *
     * @default 'utf-8'
     */
    defaultCharset?: string;
};

export type RawOptions = LimitOptions & {
    /**
     * Content-types to parse.
     *
     * @default 'application/octet-stream'
     */
    type?: string | string[];
};

export type Options = {
    json?: JsonOptions | boolean;
    raw?: RawOptions | boolean;
    text?: TextOptions | boolean;
    urlEncoded?: UrlEncodedOptions | boolean;
};
