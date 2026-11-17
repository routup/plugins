import type { PLUGIN_GROUPS } from './plugin';

export type PluginGroup = typeof PLUGIN_GROUPS[number];

export type PluginEntry = {
    package: string;
    summary: string;
    group: PluginGroup;
    url: string;
    order: number;
};

export type PluginGroupEntry = {
    group: PluginGroup;
    plugins: PluginEntry[];
};

export type SidebarLink = {
    text: string;
    link: string;
};

export type SidebarGroup = {
    text: string;
    items: SidebarLink[];
};

/**
 * One top-level entry of a sidebar: a group, or a single link.
 */
export type SidebarEntry = SidebarGroup | SidebarLink;

export type SidebarPlugin = {
    name: string;
    group: string;
    pages: SidebarLink[];
    /**
     * Names of the plugins the overview's `relatedPlugins` frontmatter lists.
     */
    related: string[];
};
