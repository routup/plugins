# ilingo

Checked against the installed ilingo 6.2.0 declarations and README.

| ilingo API / declaration | routup/plugins usage | Differences |
| --- | --- | --- |
| `dist/options/types.d.ts`: `IlingoOptions` | `packages/i18n/src/types.ts`: `Options` | The plugin also accepts a per-request locale resolver. Replaces the removed `ConfigInput` type. |
| `dist/types.d.ts`: `GetContext` | `packages/i18n/src/use-translator.ts`: `useTranslator` | The plugin fills in the request locale before calling `Ilingo.get`; translation contexts now use `namespace`, not `group`. |
| `dist/catalog.d.ts`: `defineLocale`, `defineNamespace`, `defineTranslations` | `packages/i18n/test/unit/module.spec.ts`, `packages/i18n/README.md`, `packages/docs/src/i18n/index.md` | MemoryStore fixtures and examples use catalog nodes instead of locale-keyed objects. |
