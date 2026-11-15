// Plain JavaScript: VitePress hands config imports from node_modules to Node,
// which does not strip TypeScript there. Types live in config.d.mts.
import { readFileSync } from 'node:fs';

const THEME_PACKAGE = '@routup/docs-theme';
const THEME_COLOR = '#0b1020';

const LOGO_SVG = readFileSync(new URL('./assets/logo.svg', import.meta.url), 'utf8');
const LOGO_DATA_URI = `data:image/svg+xml,${encodeURIComponent(LOGO_SVG.trim())}`;

/**
 * @param {unknown} value
 * @returns {unknown[]}
 */
function withEntry(value) {
    let list;

    if (value === undefined) {
        list = [];
    } else if (Array.isArray(value)) {
        list = value;
    } else {
        list = [value];
    }

    return list.includes(THEME_PACKAGE) ? [...list] : [...list, THEME_PACKAGE];
}

/**
 * @param {import('vitepress').UserConfig} config
 * @returns {import('vitepress').UserConfig}
 */
export function defineRoutupConfig(config) {
    const vite = config.vite ?? {};
    const ssr = vite.ssr ?? {};
    const optimizeDeps = vite.optimizeDeps ?? {};
    const head = [...(config.head ?? [])];

    const hasThemeColor = head.some(([, attrs]) => attrs?.name === 'theme-color');

    if (!hasThemeColor) {
        head.push(['meta', { name: 'theme-color', content: THEME_COLOR }]);
    }

    const hasIcon = head.some(([, attrs]) => attrs?.rel === 'icon');

    if (!hasIcon) {
        head.push(['link', {
            rel: 'icon',
            type: 'image/svg+xml',
            href: LOGO_DATA_URI,
        }]);
    }

    return {
        ...config,
        head,
        vite: {
            ...vite,
            ssr: {
                ...ssr,
                // `true` already bundles every dependency.
                noExternal: ssr.noExternal === true ? true : withEntry(ssr.noExternal),
            },
            optimizeDeps: {
                ...optimizeDeps,
                exclude: withEntry(optimizeDeps.exclude),
            },
        },
    };
}
