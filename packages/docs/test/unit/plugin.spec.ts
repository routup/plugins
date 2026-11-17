import { globSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { PLUGIN_PAGES } from '../../src/.vitepress/config.mts';
import type { PluginEntry } from '../../src/.vitepress/domains/types';
import {
    PLUGIN_GROUPS,
    PLUGIN_PAGE_PATTERN,
    buildPlugin,
    groupPlugins,
} from '../../src/.vitepress/domains/plugin';

const srcRoot = fileURLToPath(new URL('../../src', import.meta.url));

function entry(input: Partial<PluginEntry> & Pick<PluginEntry, 'package' | 'group'>): PluginEntry {
    return {
        summary: 'Summary.',
        url: '/x/',
        order: 0,
        ...input,
    };
}

describe('PLUGIN_PAGE_PATTERN', () => {
    it('matches the plugin overviews and no guide page', () => {
        const files = globSync(PLUGIN_PAGE_PATTERN, { cwd: srcRoot });

        expect(files.sort()).toEqual(PLUGIN_PAGES.map((item) => `${item.name}/index.md`).sort());
        expect(files).toHaveLength(13);
        expect(files.filter((file) => file.startsWith('guide/'))).toEqual([]);
        expect(globSync('guide/*.md', { cwd: srcRoot })).toContain('guide/getting-started.md');
    });
});

describe('buildPlugin', () => {
    it('maps valid frontmatter to an entry and keeps the url', () => {
        const result = buildPlugin('/cors/', {
            title: 'CORS',
            plugin: {
                package: '@routup/cors',
                summary: 'Preflight and CORS headers.',
                group: 'Operations',
                order: 1,
            },
        });

        expect(result).toEqual({
            package: '@routup/cors',
            summary: 'Preflight and CORS headers.',
            group: 'Operations',
            url: '/cors/',
            order: 1,
        });
    });

    it('defaults order to 0', () => {
        const result = buildPlugin('/cors/', {
            plugin: {
                package: '@routup/cors',
                summary: 'Preflight and CORS headers.',
                group: 'Operations',
            },
        });

        expect(result.order).toBe(0);
    });

    it('names the page and the key when the plugin block is missing', () => {
        expect(() => buildPlugin('/cors/', { title: 'CORS' }))
            .toThrow('/cors/: frontmatter key "plugin.package" is missing');
    });

    it('names the page and the key when summary is missing', () => {
        expect(() => buildPlugin('/cors/', { plugin: { package: '@routup/cors', group: 'Operations' } }))
            .toThrow('/cors/: frontmatter key "plugin.summary" is missing');
    });

    it('names the page and lists the groups for an unknown group', () => {
        expect(() => buildPlugin('/cors/', {
            plugin: {
                package: '@routup/cors',
                summary: 'Preflight and CORS headers.',
                group: 'Misc',
            },
        })).toThrow(`/cors/: frontmatter key "plugin.group" must be one of: ${PLUGIN_GROUPS.join(', ')}`);
    });

    it('rejects a non-numeric order', () => {
        expect(() => buildPlugin('/cors/', {
            plugin: {
                package: '@routup/cors',
                summary: 'Preflight and CORS headers.',
                group: 'Operations',
                order: 'first',
            },
        })).toThrow('/cors/: frontmatter key "plugin.order" must be a number');
    });
});

describe('groupPlugins', () => {
    it('keeps PLUGIN_GROUPS order and omits empty groups', () => {
        const result = groupPlugins([
            entry({ package: '@routup/cors', group: 'Operations' }),
            entry({ package: '@routup/basic', group: 'Bundles' }),
            entry({ package: '@routup/body', group: 'Request & response' }),
        ]);

        expect(result.map((item) => item.group)).toEqual(['Bundles', 'Request & response', 'Operations']);
    });

    it('sorts plugins in a group by order, then by package', () => {
        const result = groupPlugins([
            entry({
                package: '@routup/query',
                group: 'Request & response',
                order: 2,
            }),
            entry({
                package: '@routup/cookie',
                group: 'Request & response',
                order: 1,
            }),
            entry({ package: '@routup/zeta', group: 'Request & response' }),
            entry({
                package: '@routup/body',
                group: 'Request & response',
                order: 1,
            }),
            entry({ package: '@routup/alpha', group: 'Request & response' }),
        ]);

        expect(result[0]?.plugins.map((item) => item.package)).toEqual([
            '@routup/alpha',
            '@routup/zeta',
            '@routup/body',
            '@routup/cookie',
            '@routup/query',
        ]);
    });
});
