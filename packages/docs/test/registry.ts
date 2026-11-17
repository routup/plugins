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
];
