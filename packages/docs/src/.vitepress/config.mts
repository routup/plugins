import { defineConfig } from 'vitepress';

export default defineConfig({
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

        footer: {
            message: 'Released under the MIT License.',
            copyright: 'Copyright © 2024-present Peter Placzek',
        },
    },
});
