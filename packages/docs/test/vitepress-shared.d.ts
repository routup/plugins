/**
 * The link matching of the VitePress client, which the default theme uses
 * for the active state of nav and sidebar items. The package ships it
 * without type declarations.
 */
declare module 'vitepress/dist/client/shared.js' {
    export function isActive(currentPath: string, matchPath?: string, asRegex?: boolean): boolean;
}
