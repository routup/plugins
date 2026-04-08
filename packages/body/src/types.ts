export type BaseOptions = {
    /**
     * Maximum body size. Can be a number (bytes) or a string like '100kb', '1mb'.
     * When not set, no size limit is enforced.
     */
    limit?: number | string;

    /**
     * Cache the raw bytes in `event.store` for subsequent reads.
     * Set to `true` for small payloads that are read multiple times (e.g., JSON).
     * Set to `false` for large payloads (e.g., file uploads) to avoid memory pressure.
     *
     * @default false
     */
    cache?: boolean;
};

export type JsonOptions = BaseOptions & {
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

export type UrlEncodedOptions = BaseOptions & {
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

export type TextOptions = BaseOptions & {
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

export type RawOptions = BaseOptions & {
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
