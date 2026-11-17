import { createContentLoader } from 'vitepress';

import type { PluginGroupEntry } from '../domains/types';
import { PLUGIN_PAGE_PATTERN, buildPlugin, groupPlugins } from '../domains/plugin';

declare const data: PluginGroupEntry[];
export { data };

export default createContentLoader(PLUGIN_PAGE_PATTERN, {
    transform(raw): PluginGroupEntry[] {
        return groupPlugins(raw.map((page) => buildPlugin(page.url, page.frontmatter)));
    },
});
