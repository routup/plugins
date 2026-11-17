/**
 * Builds the path-keyed sidebar: the guide and the groups that link to every
 * plugin overview on `/guide/` and on the root pages (`/plugins` falls back
 * to the `/` key); on a plugin's pages, a link back to the overview of all
 * plugins, the plugin's own pages and its related plugins.
 */
import type {
    SidebarEntry,
    SidebarGroup,
    SidebarLink,
    SidebarPlugin,
} from './types';

/**
 * The page that lists every plugin (`src/plugins.md`).
 */
export const PLUGINS_LINK = '/plugins';

/**
 * The first entry of every plugin sidebar.
 */
export const BACK_LINK: SidebarLink = { text: '← All plugins', link: PLUGINS_LINK };

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
export function definePluginPages(
    name: string,
    group: string,
    pages: string[],
    related: string[] = [],
): SidebarPlugin {
    return {
        name,
        group,
        related,
        pages: pages.map((page) => {
            const text = PAGE_TITLES[page];

            if (!text) {
                throw new Error(`${name}: page "${page}" has no entry in PAGE_TITLES`);
            }

            return { text, link: page === 'index' ? `/${name}/` : `/${name}/${page}` };
        }),
    };
}

/**
 * Keys end in `/`, so VitePress's prefix match keeps `/rate-limit/` from
 * claiming the pages of `/rate-limit-redis/`.
 */
export function buildSidebar(plugins: SidebarPlugin[], guide: SidebarLink[]): Record<string, SidebarEntry[]> {
    const guideGroup: SidebarGroup = { text: 'Guide', items: guide };
    const groups: SidebarGroup[] = [
        {
            text: 'Overview',
            items: [{ text: 'All plugins', link: PLUGINS_LINK }],
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

    const sidebar: Record<string, SidebarEntry[]> = {
        '/': [guideGroup, ...groups],
        '/guide/': [guideGroup, ...groups],
    };

    const names = new Set(plugins.map((plugin) => plugin.name));

    for (const plugin of plugins) {
        const entries: SidebarEntry[] = [
            BACK_LINK,
            { text: plugin.name, items: plugin.pages },
        ];

        const related = plugin.related.map((name) => {
            if (!names.has(name)) {
                throw new Error(`${plugin.name}: related plugin "${name}" is not in the list`);
            }

            return { text: name, link: `/${name}/` };
        });

        if (related.length > 0) {
            entries.push({ text: 'Related', items: related });
        }

        sidebar[`/${plugin.name}/`] = entries;
    }

    return sidebar;
}
