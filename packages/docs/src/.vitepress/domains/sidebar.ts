/**
 * Builds the path-keyed sidebar: a plugin's own pages come first on each of
 * its pages, followed by the groups that link to every plugin overview.
 */
import type { SidebarGroup, SidebarPlugin } from './types';

/**
 * Sidebar title per page file name (without `.md`).
 */
export const PAGE_TITLES: Record<string, string> = {
    index: 'Overview',
    configuration: 'Configuration',
    helpers: 'Helpers',
    recipes: 'Recipes',
    controllers: 'Controllers',
    parameters: 'Parameters',
};

/**
 * One entry of the page list: `index` links to `/<name>/`, any other page
 * to `/<name>/<page>`. A page name needs a title in `PAGE_TITLES`.
 */
export function definePluginPages(name: string, group: string, pages: string[]): SidebarPlugin {
    return {
        name,
        group,
        pages: pages.map((page) => {
            const text = PAGE_TITLES[page];

            if (!text) {
                throw new Error(`${name}: page "${page}" has no entry in PAGE_TITLES`);
            }

            return { text, link: page === 'index' ? `/${name}/` : `/${name}/${page}` };
        }),
    };
}

export function buildSidebar(plugins: SidebarPlugin[]): Record<string, SidebarGroup[]> {
    const groups: SidebarGroup[] = [
        {
            text: 'Overview',
            items: [{ text: 'All plugins', link: '/' }],
        },
    ];

    for (const plugin of plugins) {
        const overview = `/${plugin.name}/`;

        if (plugin.pages[0]?.link !== overview) {
            throw new Error(`${plugin.name}: the first page must link to ${overview}`);
        }

        let group = groups.find((item) => item.text === plugin.group);

        if (!group) {
            group = { text: plugin.group, items: [] };
            groups.push(group);
        }

        group.items.push({ text: plugin.name, link: overview });
    }

    const sidebar: Record<string, SidebarGroup[]> = {
        '/': groups,
        '/guide/': groups,
    };

    for (const plugin of plugins) {
        sidebar[`/${plugin.name}/`] = [
            { text: plugin.name, items: plugin.pages },
            ...groups,
        ];
    }

    return sidebar;
}
