# @routup/docs-theme

Shared VitePress theme for the routup documentation sites
([routup.dev](https://routup.dev) and [plugins.routup.dev](https://plugins.routup.dev)).

The package ships source files and has no build step; Vite compiles them in the consuming site.

## Usage

```ts
// .vitepress/config.mts
import { defineRoutupConfig } from '@routup/docs-theme/config';

export default defineRoutupConfig({
    title: 'My site',
    themeConfig: { /* nav, sidebar, ... */ },
});
```

```ts
// .vitepress/theme/index.ts
export { default } from '@routup/docs-theme';
```

`defineRoutupConfig` adds the theme to `vite.ssr.noExternal` and `vite.optimizeDeps.exclude`, and adds a
`theme-color` meta tag and the routup logo as favicon unless the config already sets them. Nav, sidebar
and titles stay with the site.

## Design decisions

- **Direction:** a dark hero, aurora band and footer (`#0b1020`) in both colour modes; violet
  `#8b5cf6`/`#7c3aed` to cyan `#06b6d4`/`#22d3ee`; HTTP method colours GET `#10b981`, POST `#f59e0b`,
  PUT `#3b82f6`, PATCH `#8b5cf6`, DELETE `#ef4444`.
- **Type:** Geist and Geist Mono, self-hosted through fontsource. No request to Google Fonts.
- **Tokens:** plain CSS custom properties with the `--rt-*` prefix (`src/styles/tokens.css`), bridged to
  VitePress's `--vp-c-brand-*`, `--vp-button-brand-*` and `--vp-font-family-*`. No Tailwind.
- **`./config` is plain `.mjs`** with a hand-written `.d.mts`: VitePress leaves config imports from
  `node_modules` to Node, which does not strip TypeScript there.

## License

Published under [MIT License](./LICENSE).
