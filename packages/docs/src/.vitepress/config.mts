import { defineRoutupConfig } from '@routup/docs-theme/config';

export default defineRoutupConfig({
    title: 'Routup Plugins',
    description: 'Plugins for the routup HTTP routing framework — body, cookie, query, decorators, swagger-ui, rate-limit, prometheus, i18n, and more.',
    base: '/',
    cleanUrls: true,
    lastUpdated: true,

    head: [
        ['meta', { name: 'theme-color', content: '#7c3aed' }],
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

        sidebar: [
            {
                text: 'Overview',
                items: [
                    { text: 'All plugins', link: '/' },
                ],
            },
            {
                text: 'Bundles',
                items: [
                    { text: 'basic', link: '/basic/' },
                ],
            },
            {
                text: 'Request & response',
                items: [
                    { text: 'body', link: '/body/' },
                    { text: 'cookie', link: '/cookie/' },
                    { text: 'query', link: '/query/' },
                    { text: 'assets', link: '/assets/' },
                ],
            },
            {
                text: 'Routing patterns',
                items: [
                    { text: 'decorators', link: '/decorators/' },
                ],
            },
            {
                text: 'API documentation',
                items: [
                    { text: 'swagger-ui', link: '/swagger-ui/' },
                ],
            },
            {
                text: 'Operations',
                items: [
                    { text: 'cors', link: '/cors/' },
                    { text: 'logger', link: '/logger/' },
                    { text: 'rate-limit', link: '/rate-limit/' },
                    { text: 'rate-limit-redis', link: '/rate-limit-redis/' },
                    { text: 'prometheus', link: '/prometheus/' },
                    { text: 'i18n', link: '/i18n/' },
                ],
            },
        ],

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
