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
     * When `'*'` is combined with `credentials: true`, the value is auto-expanded to the
     * enumerated list of HTTP methods browsers can send via fetch
     * (`GET, HEAD, POST, PUT, PATCH, DELETE, OPTIONS`), since the literal `*` is not
     * honoured as a wildcard by browsers under credentialed requests.
     *
     * @default '*'
     */
    methods?: CorsListOption;

    /**
     * Value of `access-control-allow-headers` for preflight responses.
     * When `'*'` or empty, mirrors the request's `access-control-request-headers` — so `'*'` is
     * safe to use even with `credentials: true`, since the literal `*` never hits the wire.
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
     * Browsers treat a literal `'*'` as non-wildcard for credentialed requests, so the plugin
     * normalises the wildcards it can:
     * - `methods: '*'` is auto-expanded to the enumerated list of fetchable HTTP methods.
     * - `allowHeaders: '*'` is mirrored from the preflight's `Access-Control-Request-Headers`,
     *   so `*` never reaches the wire.
     * - `exposeHeaders: '*'` cannot be auto-resolved (the browser does not advertise wanted
     *   response headers). The response is not blocked, but only the seven CORS-safelisted
     *   response headers stay visible to JavaScript. Enumerate any custom headers you want
     *   readable from the client.
     * - `origin: '*'` is *not* auto-rewritten because the credentials-friendly equivalent
     *   (`origin: true`) changes the security posture (any origin can call you with the user's
     *   cookies). The plugin emits a warning instead — switch to `origin: true` or an explicit
     *   allow-list yourself.
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
