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
