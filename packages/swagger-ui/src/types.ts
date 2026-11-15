import type { SwaggerConfigs } from 'swagger-ui-dist';

export type UIOAuthOptions = {
    clientId?: string,
    clientSecret?: string,
    realm?: string,
    appName?: string,
    scopeOperator?: string,
    scopes: string[] | string,
    additionalQueryStringParams?: Record<string, any>,
    useBasicAuthenticationWithAccessCodeGrant?: boolean,
    usePkceWithAuthorizationCodeGrant?: boolean
};

export type UIOptions = SwaggerConfigs & {
    /**
     * OAuth Options
     */
    oauth?: UIOAuthOptions,

    /**
     * Auth action.
     */
    authAction?: Record<string, any>,

    /**
     * The baseUrl defines the base url,
     * where the application is run.
     */
    baseURL?: string,

    /**
     * the basePath defines the path relative to the fqdn
     * on which the application is run.
     */
    basePath?: string,

    /**
     * OAuth2 redirect url passed to Swagger UI.
     * Setting it (or `oauth`) also serves `oauth2-redirect.html`.
     */
    oauth2RedirectUrl?: string,

    /**
     * Validator url for the badge of url documents ('none' or null disables it).
     */
    validatorUrl?: string | null,

    /**
     * Set a `content-security-policy` header on every response.
     * `true` sets the recommended policy (see `buildContentSecurityPolicy`),
     * a string sets that exact policy.
     *
     * default: false
     */
    csp?: boolean | string,
};

export type ContentSecurityPolicyInput = {
    /**
     * Additional origins the UI itself is served from.
     */
    origins?: string[],

    /**
     * Additional sources for `connect-src` (spec url, API servers, token endpoints).
     */
    connectSrc?: string[],

    /**
     * Additional sources for `img-src`.
     */
    imgSrc?: string[],
};
