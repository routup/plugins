/**
 * Maps the `plugin` frontmatter block of each plugin page to a card on the
 * landing page. Bad input names the page and the key, so a broken page
 * fails the build with a message that points at the fix.
 */
import type { PluginEntry, PluginGroup, PluginGroupEntry } from './types';

/**
 * The pages the landing page reads, relative to the site root: the overview
 * of each plugin folder. Guide pages live in `guide/`, which has no
 * `index.md`, so they are not read as plugins.
 */
export const PLUGIN_PAGE_PATTERN = '*/index.md';

export const PLUGIN_GROUPS = [
    'Bundles',
    'Request & response',
    'Routing patterns',
    'API documentation',
    'Operations',
] as const;

function isRecord(input: unknown): input is Record<string, unknown> {
    return typeof input === 'object' && input !== null && !Array.isArray(input);
}

function isPluginGroup(input: unknown): input is PluginGroup {
    return (PLUGIN_GROUPS as readonly unknown[]).includes(input);
}

function readString(url: string, block: Record<string, unknown>, key: string): string {
    const value = block[key];

    if (typeof value !== 'string' || value.length === 0) {
        throw new Error(`${url}: frontmatter key "plugin.${key}" is missing`);
    }

    return value;
}

export function buildPlugin(url: string, frontmatter: Record<string, unknown>): PluginEntry {
    const block = isRecord(frontmatter.plugin) ? frontmatter.plugin : {};

    const name = readString(url, block, 'package');
    const summary = readString(url, block, 'summary');
    const group = readString(url, block, 'group');

    if (!isPluginGroup(group)) {
        throw new Error(`${url}: frontmatter key "plugin.group" must be one of: ${PLUGIN_GROUPS.join(', ')}`);
    }

    const order = block.order ?? 0;

    if (typeof order !== 'number' || Number.isNaN(order)) {
        throw new TypeError(`${url}: frontmatter key "plugin.order" must be a number`);
    }

    return {
        package: name,
        summary,
        group,
        url,
        order,
    };
}

export function groupPlugins(entries: PluginEntry[]): PluginGroupEntry[] {
    return PLUGIN_GROUPS
        .map((group) => ({
            group,
            plugins: entries
                .filter((entry) => entry.group === group)
                .sort((a, b) => a.order - b.order || a.package.localeCompare(b.package)),
        }))
        .filter((item) => item.plugins.length > 0);
}
