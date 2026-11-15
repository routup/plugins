import { describe, expect, it } from 'vitest';
import { clampTabIndex, moveTabIndex } from '../../src/tabs';

describe('clampTabIndex', () => {
    it('keeps an index inside the range', () => {
        expect(clampTabIndex(1, 3)).toBe(1);
    });

    it('clamps an index past the last tab to the last tab', () => {
        expect(clampTabIndex(5, 3)).toBe(2);
    });

    it('clamps a negative index to the first tab', () => {
        expect(clampTabIndex(-1, 3)).toBe(0);
    });

    it('returns 0 without tabs or for a non-number', () => {
        expect(clampTabIndex(2, 0)).toBe(0);
        expect(clampTabIndex(NaN, 3)).toBe(0);
    });
});

describe('moveTabIndex', () => {
    it('moves right and wraps from the last to the first tab', () => {
        expect(moveTabIndex('ArrowRight', 0, 3)).toBe(1);
        expect(moveTabIndex('ArrowRight', 2, 3)).toBe(0);
    });

    it('moves left and wraps from the first to the last tab', () => {
        expect(moveTabIndex('ArrowLeft', 2, 3)).toBe(1);
        expect(moveTabIndex('ArrowLeft', 0, 3)).toBe(2);
    });

    it('goes to the first tab on Home and the last on End', () => {
        expect(moveTabIndex('Home', 2, 3)).toBe(0);
        expect(moveTabIndex('End', 0, 3)).toBe(2);
    });

    it('ignores other keys and an empty tablist', () => {
        expect(moveTabIndex('Enter', 1, 3)).toBeUndefined();
        expect(moveTabIndex('ArrowUp', 1, 3)).toBeUndefined();
        expect(moveTabIndex('ArrowRight', 0, 0)).toBeUndefined();
    });
});
