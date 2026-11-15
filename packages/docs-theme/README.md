# @routup/docs-theme

Shared VitePress theme for the routup documentation sites
([routup.dev](https://routup.dev) and [plugins.routup.dev](https://plugins.routup.dev)).

The package ships source files and has no build step; Vite compiles them in the consuming site.

## Installation

```bash
npm install @routup/docs-theme
```

Peer dependencies: `vitepress@^1.6.0` and `vue@^3.5.0`.

## Usage

```ts
// .vitepress/config.mts
import { defineRoutupConfig } from '@routup/docs-theme/config';

export default defineRoutupConfig({
    title: 'My site',
    themeConfig: { /* nav, sidebar, rtFooter, ... */ },
});
```

```ts
// .vitepress/theme/index.ts
import Theme from '@routup/docs-theme';
import './custom.css'; // the site's own styles, if any

export default Theme;
```

`defineRoutupConfig` adds the theme to `vite.ssr.noExternal` and `vite.optimizeDeps.exclude`, and adds a
`theme-color` meta tag and the routup logo as favicon unless the config already sets them. Nav, sidebar
and titles stay with the site.

The theme extends VitePress's default theme without its Inter fonts (`vitepress/theme-without-fonts`),
imports the styles and registers the components below globally.

## Footer

`RtFooter` is mounted on every page. It reads `themeConfig.rtFooter` and renders nothing when it is
not set:

```ts
themeConfig: {
    rtFooter: {
        tagline: 'Plugins for routup.',
        columns: [
            {
                title: 'Project',
                links: [
                    { text: 'GitHub', link: 'https://github.com/routup/plugins' },
                    { text: 'Issues', link: 'https://github.com/routup/plugins/issues' },
                ],
            },
        ],
        note: 'MIT licensed', // optional
    },
}
```

A column without links is dropped; a link without `link` throws an error naming its entry. The types
are exported as `RtFooterConfig`, `RtFooterColumn`, `RtFooterLink` and `RoutupThemeConfig`.

## Components

Registered globally and importable from `@routup/docs-theme/components/<Name>.vue`. They render the
same on landing pages and inside markdown pages (`.vp-doc`).

| Component | Props | Purpose |
|-----------|-------|---------|
| `RtSection` | `surface` (`default`, `tinted`, `dark`, `aurora`), `id` | Page section with the shared rhythm and surface |
| `RtHeading` | `title`, `highlight`, `eyebrow`, `lede`, `align` (`start`, `center`), `level` (`1`, `2`) | Section heading; `highlight` follows the title in the brand gradient |
| `RtCard` | `href` | Card; a link when `href` is set |
| `RtCodePanel` | `title`, `code`, `tabs` (`{ label, code }[]`), `active`; `footer` slot | Code panel with title bar and optional tabs |
| `RtButton` | `href`, `variant` (`primary`, `ghost`) | Link styled as a button |
| `RtMethodBadge` | `method` | HTTP method label in its method colour, made for dark surfaces |
| `RtLogo` | `size` | The routup logo |

A link is external when it starts with `http://`, `https://` or `//` (`isExternalLink` in
`src/links.ts`). External links open in a new tab; there is no prop for it. Only `RtFooter` applies
`withBase()` to internal links. `RtCard` and `RtButton` render `href` as given, so a site with a `base`
passes the full path.

## Landing pages

A landing page sets `layout: page` and `pageClass: rt-home`. On such a page the nav is transparent
over a dark hero, and VitePress's mobile local nav is hidden. From 960px the nav is fixed over the
hero. The theme sets `--rt-nav-offset` to the nav height there; the site's own landing hero must add it
to its top padding to clear the bar. A site with a global sidebar sets `sidebar: false` on its landing
page.

## What the theme assumes about VitePress

The styles reach into VitePress's default theme in a few places, so a VitePress upgrade needs a
re-check of these:

- the nav bar's `.VPNavBar.top` class at scroll position 0 (transparent nav on landing pages);
- the `.VPLocalNav` element (hidden on landing pages);
- the sidebar's z-index of 25 from 960px (`RtFooter` paints above it at 26);
- the `vitepress/theme-without-fonts` entry.

## Design decisions

- **Direction:** a dark hero, aurora band and footer (`#0b1020`) in both colour modes; violet
  `#8b5cf6`/`#7c3aed` to cyan `#06b6d4`/`#22d3ee`; HTTP method colours GET `#10b981`, POST `#f59e0b`,
  PUT `#3b82f6`, PATCH `#8b5cf6`, DELETE `#ef4444`.
- **Type:** Geist and Geist Mono, self-hosted through fontsource. No request to Google Fonts.
- **Tokens:** plain CSS custom properties with the `--rt-*` prefix (`src/styles/tokens.css`), bridged to
  VitePress's `--vp-c-brand-*`, `--vp-button-brand-*` and `--vp-font-family-*`, and in dark mode also its
  background, border, divider and text colours, so the whole site is one navy palette. No Tailwind.
- **Shared versus per site:** the theme holds tokens, fonts, nav and footer chrome, doc-page styles and
  the building blocks above. Each site keeps its nav, sidebar, titles, footer links, landing-page
  sections and all copy (in the page frontmatter), so a content change needs no theme release.
- **Source only:** `.vue`, `.ts` and `.css` files are published as they are and compiled by the site's
  Vite. There is no build step.
- **`./config` is plain `.mjs`** with a hand-written `.d.mts`: VitePress leaves config imports from
  `node_modules` to Node, which does not strip TypeScript there.
- **Overrides of VitePress's own styles** are unlayered and come last, since VitePress's component
  styles are unlayered too.

## License

Published under [MIT License](./LICENSE).
