export type CorsOriginOption = '*' |
    'null' |
    (string | RegExp)[] |
    ((origin: string) => boolean);

export type CorsListOption = '*' | string[];

export type Options = {
    /**
     * Determines the value of the `access-control-allow-origin` response header.
     * - `'*'` allows all origins.
     * - `'null'` allows opaque (sandboxed) origins.
     * - An array of strings / RegExps is matched against the request `Origin`.
     * - A function receives the request `Origin` and returns `true` if allowed.
     *
     * @default '*'
     */
    origin?: CorsOriginOption;

    /**
     * Value of `access-control-allow-methods` for preflight responses.
     *
     * @default '*'
     */
    methods?: CorsListOption;

    /**
     * Value of `access-control-allow-headers` for preflight responses.
     * When `'*'` or empty, mirrors the request's `access-control-request-headers`.
     *
     * @default '*'
     */
    allowHeaders?: CorsListOption;

    /**
     * Value of `access-control-expose-headers` on actual responses.
     *
     * @default '*'
     */
    exposeHeaders?: CorsListOption;

    /**
     * Sets `access-control-allow-credentials: true` when enabled.
     * When credentials are allowed, none of `origin`, `methods`, `exposeHeaders`,
     * `allowHeaders` may be `'*'` — browsers will reject the response.
     *
     * @default false
     */
    credentials?: boolean;

    /**
     * Value of `access-control-max-age` for preflight responses.
     *
     * @default false
     */
    maxAge?: string | false;

    /**
     * Tuning for the preflight response itself.
     */
    preflight?: {
        /**
         * Status code returned for preflight (`OPTIONS`) requests.
         *
         * @default 204
         */
        statusCode?: number;
    };
};

export type ResolvedOptions = {
    origin: CorsOriginOption;
    methods: CorsListOption;
    allowHeaders: CorsListOption;
    exposeHeaders: CorsListOption;
    credentials: boolean;
    maxAge: string | false;
    preflight: {
        statusCode: number;
    };
};

export type CorsHeaderEntry = readonly [name: string, value: string];
