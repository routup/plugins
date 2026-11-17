import { describe, expect, it } from 'vitest';
import { buildSidebar } from '../../src/.vitepress/domains/sidebar';

const plugins = [
    {
        name: 'basic',
        group: 'Bundles',
        pages: [{ text: 'Overview', link: '/basic/' }],
    },
    {
        name: 'rate-limit',
        group: 'Operations',
        pages: [
            { text: 'Overview', link: '/rate-limit/' },
            { text: 'Configuration', link: '/rate-limit/configuration' },
        ],
    },
    {
        name: 'cors',
        group: 'Operations',
        pages: [{ text: 'Overview', link: '/cors/' }],
    },
];

const groups = [
    {
        text: 'Overview',
        items: [{ text: 'All plugins', link: '/' }],
    },
    {
        text: 'Bundles',
        items: [{ text: 'basic', link: '/basic/' }],
    },
    {
        text: 'Operations',
        items: [
            { text: 'rate-limit', link: '/rate-limit/' },
            { text: 'cors', link: '/cors/' },
        ],
    },
];

describe('buildSidebar', () => {
    it('shows the plugin groups at the root and under /guide/', () => {
        const sidebar = buildSidebar(plugins);

        expect(sidebar['/']).toEqual(groups);
        expect(sidebar['/guide/']).toEqual(groups);
    });

    it('puts the pages of a plugin first under its own path', () => {
        const sidebar = buildSidebar(plugins);

        expect(sidebar['/rate-limit/']).toEqual([
            {
                text: 'rate-limit',
                items: [
                    { text: 'Overview', link: '/rate-limit/' },
                    { text: 'Configuration', link: '/rate-limit/configuration' },
                ],
            },
            ...groups,
        ]);
        expect(sidebar['/basic/']?.[0]).toEqual({
            text: 'basic',
            items: [{ text: 'Overview', link: '/basic/' }],
        });
    });

    it('has one key per plugin plus / and /guide/', () => {
        expect(Object.keys(buildSidebar(plugins)).sort()).toEqual(['/', '/basic/', '/cors/', '/guide/', '/rate-limit/']);
    });

    it('rejects a plugin whose first page is not its overview', () => {
        expect(() => buildSidebar([{
            name: 'cors',
            group: 'Operations',
            pages: [{ text: 'Helpers', link: '/cors/helpers' }],
        }])).toThrow('cors: the first page must link to /cors/');
    });
});
