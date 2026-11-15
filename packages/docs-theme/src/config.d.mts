import type { DefaultTheme, UserConfig } from 'vitepress';
import type { RoutupThemeConfig } from './types.js';

/**
 * Add what every routup docs site needs to a VitePress config: the theme in
 * `vite.ssr.noExternal` and `vite.optimizeDeps.exclude`, plus `theme-color`
 * and favicon head entries unless the config sets them. Nav, sidebar and
 * titles are left to the site.
 */
export declare function defineRoutupConfig<
    ThemeConfig extends DefaultTheme.Config & RoutupThemeConfig = DefaultTheme.Config & RoutupThemeConfig,
>(config: UserConfig<ThemeConfig>): UserConfig<ThemeConfig>;
