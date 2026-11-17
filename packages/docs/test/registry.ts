/**
 * The plugins whose docs pages are checked against their code by
 * `test/unit/registry.spec.ts`.
 */
export type PluginDocs = {
    /**
     * Folder name under packages/ and packages/docs/src/.
     */
    name: string;
    /**
     * Exported type whose keys are the options; omit when the plugin has none.
     */
    optionsType?: string;
    /**
     * Page with the Options table, relative to packages/docs/src/<name>/.
     */
    optionsPage?: string;
    /**
     * Pages whose headings and tables document the exports.
     */
    apiPages: string[];
    /**
     * Runtime export -> reason it is not documented under its own name.
     */
    exempt?: Record<string, string>;
    /**
     * Type export -> reason it is neither a documented name nor declared in
     * a code block of an API page.
     */
    typeExempt?: Record<string, string>;
    /**
     * Options key -> reason it is not in the Options table.
     */
    optionExempt?: Record<string, string>;
    /**
     * Exported option types of an option value (such as the parser options
     * of body's `json`): the first table under `heading` on `page` (default
     * `optionsPage`) lists exactly the keys of `type`, or some of them with
     * `subset`.
     */
    nestedOptions?: NestedOptionsDocs[];
    /**
     * Subpath entries of the package (such as `@routup/decorators/preset`),
     * each checked like the main entry against its own pages.
     */
    entries?: EntryDocs[];
    /**
     * Subpath of the package exports (such as "./body") -> reason it is not
     * in `entries`.
     */
    subpathExempt?: Record<string, string>;
};

export type EntryDocs = {
    /**
     * Package specifier, for example "@routup/decorators/preset"; its
     * subpath must be in the `exports` of the package.json.
     */
    specifier: string;
    /**
     * Source file of the entry, relative to packages/<name>/src/.
     */
    file: string;
    /**
     * Pages whose headings and tables document the exports of this entry;
     * none of them may be in the plugin's `apiPages`.
     */
    apiPages: string[];
    /**
     * Runtime export -> reason it is not documented under its own name.
     */
    exempt?: Record<string, string>;
    /**
     * Type export -> reason it is not documented under its own name.
     */
    typeExempt?: Record<string, string>;
};

export type NestedOptionsDocs = {
    /**
     * Exported type whose keys the table lists.
     */
    type: string;
    /**
     * Exact heading text, for example "`json`".
     */
    heading: string;
    /**
     * Page relative to packages/docs/src/<name>/; defaults to optionsPage.
     */
    page?: string;
    /**
     * The table lists only some keys: every name in it must be a key of
     * `type`, but not every key needs a row.
     */
    subset?: boolean;
};

export const PLUGINS: PluginDocs[] = [
    {
        name: 'assets',
        optionsType: 'OptionsInput',
        optionsPage: 'configuration.md',
        apiPages: ['helpers.md'],
        optionExempt: { directoryPath: 'replaced by the directory argument of assets(), stated under the Options table' },
    },
    {
        name: 'basic',
        optionsType: 'Options',
        optionsPage: 'index.md',
        apiPages: ['index.md'],
        subpathExempt: {
            './body': 're-exports @routup/body, documented on /body/',
            './cookie': 're-exports @routup/cookie, documented on /cookie/',
            './query': 're-exports @routup/query, documented on /query/',
        },
    },
    {
        name: 'body',
        optionsType: 'Options',
        optionsPage: 'configuration.md',
        apiPages: ['helpers.md'],
        nestedOptions: [
            { type: 'JsonOptions', heading: '`json`' },
            { type: 'UrlEncodedOptions', heading: '`urlEncoded`' },
            { type: 'RawOptions', heading: '`raw`' },
            { type: 'TextOptions', heading: '`text`' },
        ],
    },
    {
        name: 'cookie',
        optionsType: 'Options',
        optionsPage: 'configuration.md',
        apiPages: ['helpers.md'],
        nestedOptions: [
            { type: 'ParseOptions', heading: '`parse`' },
            {
                type: 'SerializeOptions',
                heading: '`setResponseCookie()`',
                page: 'helpers.md',
            },
        ],
    },
    {
        name: 'cors',
        optionsType: 'Options',
        optionsPage: 'configuration.md',
        apiPages: ['helpers.md'],
    },
    {
        name: 'decorators',
        optionsType: 'Options',
        optionsPage: 'configuration.md',
        apiPages: ['controllers.md', 'parameters.md', 'helpers.md'],
        entries: [{
            specifier: '@routup/decorators/preset',
            file: 'preset/index.ts',
            apiPages: ['index.md'],
            exempt: { default: 'the preset object buildPreset() returns, stated under buildPreset()' },
        }],
    },
    {
        name: 'i18n',
        optionsType: 'Options',
        optionsPage: 'index.md',
        apiPages: ['index.md'],
    },
    {
        name: 'logger',
        optionsType: 'Options',
        optionsPage: 'configuration.md',
        apiPages: ['helpers.md'],
    },
    {
        name: 'prometheus',
        optionsType: 'Options',
        optionsPage: 'configuration.md',
        apiPages: ['helpers.md'],
    },
    {
        name: 'query',
        optionsType: 'Options',
        optionsPage: 'configuration.md',
        apiPages: ['helpers.md'],
        // qs has more parse options than the page lists; it links the qs docs
        nestedOptions: [{
            type: 'ParseOptions',
            heading: '`parse`',
            subset: true,
        }],
    },
    {
        name: 'rate-limit',
        optionsType: 'Options',
        optionsPage: 'configuration.md',
        apiPages: ['helpers.md'],
    },
    {
        // no options type: the constructor argument is documented by hand
        name: 'rate-limit-redis',
        apiPages: ['index.md'],
    },
    {
        name: 'swagger-ui',
        optionsType: 'UIOptions',
        optionsPage: 'configuration.md',
        apiPages: ['helpers.md'],
        nestedOptions: [
            { type: 'UIOAuthOptions', heading: '`oauth`' },
            { type: 'ContentSecurityPolicyInput', heading: '`csp`' },
        ],
    },
];
