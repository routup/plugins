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
};

export const PLUGINS: PluginDocs[] = [
    {
        name: 'rate-limit',
        optionsType: 'Options',
        optionsPage: 'configuration.md',
        apiPages: ['helpers.md'],
    },
];
