import { describe, expect, it } from 'vitest';
import { defineRoutupConfig } from '../../src/config.mjs';

const THEME = '@routup/docs-theme';

describe('defineRoutupConfig', () => {
    it('adds the theme to vite.ssr.noExternal', () => {
        const config = defineRoutupConfig({});

        expect(config.vite?.ssr?.noExternal).toEqual([THEME]);
    });

    it('keeps existing noExternal entries', () => {
        const config = defineRoutupConfig({ vite: { ssr: { noExternal: ['routup'] } } });

        expect(config.vite?.ssr?.noExternal).toEqual(['routup', THEME]);
    });

    it('adds the theme to vite.optimizeDeps.exclude', () => {
        const config = defineRoutupConfig({ vite: { optimizeDeps: { exclude: ['routup'] } } });

        expect(config.vite?.optimizeDeps?.exclude).toEqual(['routup', THEME]);
    });

    it('adds no duplicate when applied twice', () => {
        const config = defineRoutupConfig(defineRoutupConfig({}));

        expect(config.vite?.ssr?.noExternal).toEqual([THEME]);
        expect(config.vite?.optimizeDeps?.exclude).toEqual([THEME]);
        expect(config.head).toHaveLength(2);
    });

    it('adds a theme-color entry when none exists', () => {
        const config = defineRoutupConfig({});

        expect(config.head).toContainEqual(['meta', { name: 'theme-color', content: '#0b1020' }]);
    });

    it('keeps an existing theme-color entry', () => {
        const config = defineRoutupConfig({ head: [['meta', { name: 'theme-color', content: '#7c3aed' }]] });

        const entries = (config.head ?? []).filter(([, attrs]) => attrs.name === 'theme-color');

        expect(entries).toEqual([['meta', { name: 'theme-color', content: '#7c3aed' }]]);
    });

    it('adds an svg icon as data URI when none exists', () => {
        const config = defineRoutupConfig({});

        const icons = (config.head ?? []).filter(([, attrs]) => attrs.rel === 'icon');

        expect(icons).toHaveLength(1);
        expect(icons[0]?.[1]).toMatchObject({
            type: 'image/svg+xml',
            href: expect.stringMatching(/^data:image\/svg\+xml/),
        });
    });

    it('keeps an existing icon entry', () => {
        const config = defineRoutupConfig({ head: [['link', { rel: 'icon', href: '/favicon.ico' }]] });

        const icons = (config.head ?? []).filter(([, attrs]) => attrs.rel === 'icon');

        expect(icons).toEqual([['link', { rel: 'icon', href: '/favicon.ico' }]]);
    });

    it('passes title and nav through unchanged', () => {
        const nav = [{ text: 'Guide', link: '/guide/' }];
        const config = defineRoutupConfig({ title: 'Routup', themeConfig: { nav } });

        expect(config.title).toBe('Routup');
        expect(config.themeConfig?.nav).toBe(nav);
    });
});
