import { createContentLoader } from 'vitepress';

import type { PluginGroupEntry } from '../domains/types';
import { buildPlugin, groupPlugins } from '../domains/plugin';

declare const data: PluginGroupEntry[];
export { data };

export default createContentLoader('*/index.md', {
    transform(raw): PluginGroupEntry[] {
        return groupPlugins(raw.map((page) => buildPlugin(page.url, page.frontmatter)));
    },
});
