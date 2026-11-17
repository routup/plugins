/**
 * Builds the path-keyed sidebar: a plugin's own pages come first on each of
 * its pages, followed by the groups that link to every plugin overview.
 */
import type { SidebarGroup, SidebarPlugin } from './types';

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
