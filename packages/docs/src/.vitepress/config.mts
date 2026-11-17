import { defineRoutupConfig } from '@routup/docs-theme/config';
import { buildSidebar, definePluginPages as plugin } from './domains/sidebar';
import type { SidebarLink, SidebarPlugin } from './domains/types';

/**
 * The pages of `src/guide/`, in sidebar order.
 */
export const GUIDE_PAGES: SidebarLink[] = [
    { text: 'Getting Started', link: '/guide/getting-started' },
    { text: 'Combining Plugins', link: '/guide/combining' },
];

/**
 * Every plugin, the pages it has in sidebar order and the plugins it is
 * related to. A plugin's pages are the files in packages/docs/src/<name>/;
 * the registry spec checks that the two agree for each registered plugin.
 * Its related plugins are the `relatedPlugins` of its overview frontmatter;
 * the sidebar spec checks that the two agree.
 */
export const PLUGIN_PAGES: SidebarPlugin[] = [
    plugin('basic', 'Bundles', ['index'], ['body', 'cookie', 'query', 'decorators']),
    plugin('body', 'Request & response', ['index', 'configuration', 'helpers', 'recipes'], ['basic', 'decorators']),
    plugin('cookie', 'Request & response', ['index', 'configuration', 'helpers', 'recipes'], ['basic', 'decorators']),
    plugin('query', 'Request & response', ['index', 'configuration', 'helpers', 'recipes'], ['basic', 'decorators']),
    plugin('assets', 'Request & response', ['index', 'configuration', 'helpers', 'recipes']),
    plugin('decorators', 'Routing patterns', ['index', 'controllers', 'parameters', 'configuration', 'helpers', 'recipes'], ['basic', 'body', 'cookie', 'query', 'swagger-ui']),
    plugin('swagger-ui', 'API documentation', ['index', 'configuration', 'helpers', 'recipes'], ['decorators']),
    plugin('cors', 'Operations', ['index', 'configuration', 'helpers', 'recipes'], ['body', 'cookie']),
    plugin('logger', 'Operations', ['index', 'configuration', 'helpers', 'recipes']),
    plugin('rate-limit', 'Operations', ['index', 'configuration', 'helpers', 'recipes'], ['rate-limit-redis']),
    plugin('rate-limit-redis', 'Operations', ['index'], ['rate-limit']),
    plugin('prometheus', 'Operations', ['index', 'configuration', 'helpers', 'recipes']),
    plugin('i18n', 'Operations', ['index']),
];

export default defineRoutupConfig({
    title: 'Routup Plugins',
    description: 'Plugins for the routup HTTP routing framework — body, cookie, query, decorators, swagger-ui, rate-limit, prometheus, i18n, and more.',
    base: '/',
    cleanUrls: true,
    lastUpdated: true,

    head: [
        ['meta', { property: 'og:type', content: 'website' }],
        ['meta', { property: 'og:title', content: 'Routup Plugins' }],
        ['meta', {
            property: 'og:description',
            content: 'Plugins for the routup HTTP routing framework.',
        }],
    ],

    themeConfig: {
        search: { provider: 'local' },

        nav: [
            { text: 'Routup', link: 'https://routup.dev' },
            {
                text: 'Guide',
                link: '/guide/getting-started',
                activeMatch: '/guide/',
            },
            { text: 'Plugins', link: '/' },
        ],

        sidebar: buildSidebar(PLUGIN_PAGES, GUIDE_PAGES),

        socialLinks: [
            { icon: 'github', link: 'https://github.com/routup/plugins' },
        ],

        editLink: {
            pattern: 'https://github.com/routup/plugins/edit/master/packages/docs/src/:path',
            text: 'Edit this page on GitHub',
        },

        rtFooter: {
            tagline: 'Plugins for routup.',
            columns: [
                {
                    title: 'Docs',
                    links: [
                        { text: 'Getting started', link: '/guide/getting-started' },
                        { text: 'Combining plugins', link: '/guide/combining' },
                        { text: 'All plugins', link: '/' },
                        { text: 'routup', link: 'https://routup.dev' },
                        { text: 'Plugin authoring', link: 'https://routup.dev/guide/plugin-authoring/' },
                    ],
                },
                {
                    title: 'Plugins',
                    links: [
                        { text: 'Bundles', link: '/basic/' },
                        { text: 'Request & response', link: '/body/' },
                        { text: 'Routing patterns', link: '/decorators/' },
                        { text: 'API documentation', link: '/swagger-ui/' },
                        { text: 'Operations', link: '/cors/' },
                    ],
                },
                {
                    title: 'Project',
                    links: [
                        { text: 'GitHub', link: 'https://github.com/routup/plugins' },
                        { text: 'Releases', link: 'https://github.com/routup/plugins/releases' },
                        { text: 'Issues', link: 'https://github.com/routup/plugins/issues' },
                    ],
                },
            ],
            note: 'MIT licensed',
        },
    },
});
