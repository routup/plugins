import { defineRoutupConfig } from '@routup/docs-theme/config';
import { buildSidebar, definePluginPages as plugin } from './domains/sidebar';
import type { SidebarPlugin } from './domains/types';

/**
 * Every plugin and the pages it has, in sidebar order. A plugin's pages are
 * the files in packages/docs/src/<name>/; the registry spec checks that the
 * two agree for each registered plugin.
 */
export const PLUGIN_PAGES: SidebarPlugin[] = [
    plugin('basic', 'Bundles', ['index', 'configuration']),
    plugin('body', 'Request & response', ['index', 'configuration', 'helpers']),
    plugin('cookie', 'Request & response', ['index', 'helpers']),
    plugin('query', 'Request & response', ['index', 'helpers']),
    plugin('assets', 'Request & response', ['index', 'configuration']),
    plugin('decorators', 'Routing patterns', ['index', 'controllers', 'parameters']),
    plugin('swagger-ui', 'API documentation', ['index']),
    plugin('cors', 'Operations', ['index', 'helpers']),
    plugin('logger', 'Operations', ['index', 'helpers']),
    plugin('rate-limit', 'Operations', ['index', 'configuration', 'helpers', 'recipes']),
    plugin('rate-limit-redis', 'Operations', ['index']),
    plugin('prometheus', 'Operations', ['index', 'configuration']),
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
            { text: 'Plugins', link: '/' },
        ],

        sidebar: buildSidebar(PLUGIN_PAGES),

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
