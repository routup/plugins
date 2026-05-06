export type CorsOriginOption = boolean |
    string |
    RegExp |
    (string | RegExp)[] |
    ((origin: string) => boolean);

export type CorsListOption = '*' | string[];

export type CorsMaxAgeOption = string | number | false;

export type Options = {
    /**
     * Determines the value of the `access-control-allow-origin` response header.
     * - `true` reflects the request `Origin` (credentials-friendly equivalent of `'*'`).
     * - `false` skips CORS handling entirely (no headers, preflight passes through).
     * - `'*'` allows all origins.
     * - `'null'` allows opaque (sandboxed) origins.
     * - A bare string is emitted as-is (e.g. `'https://app.example.com'`).
     * - A `RegExp` is matched against the request `Origin`; on match, the origin is reflected.
     * - An array of strings / RegExps is iterated; on first match, the origin is reflected.
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
     * Value of `access-control-max-age` for preflight responses, in seconds.
     * Numbers are stringified.
     *
     * @default false
     */
    maxAge?: CorsMaxAgeOption;

    /**
     * When `true`, preflight responses set the `Access-Control-*` headers and
     * then call `event.next()` so the user's own `OPTIONS` handler can take
     * over. When `false` (default), the plugin short-circuits with a 204.
     *
     * @default false
     */
    preflightContinue?: boolean;

    /**
     * Tuning for the preflight response itself.
     */
    preflight?: {
        /**
         * Status code returned for preflight (`OPTIONS`) requests.
         *
         * @default 204
         */
        status?: number;
    };
};

export type ResolvedOptions = {
    origin: CorsOriginOption;
    methods: CorsListOption;
    allowHeaders: CorsListOption;
    exposeHeaders: CorsListOption;
    credentials: boolean;
    maxAge: CorsMaxAgeOption;
    preflightContinue: boolean;
    preflight: {
        status: number;
    };
};

export type CorsHeaderEntry = readonly [name: string, value: string];
