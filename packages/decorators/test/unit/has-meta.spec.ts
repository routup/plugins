// eslint-disable-next-line max-classes-per-file
import { describe, expect, it } from 'vitest';
import { DController, DGet, hasDecoratorMeta } from '../../src';

@DController('/x')
class DecoratedController {
    @DGet('/')
    index() {
        return 'x';
    }
}

class PlainClass {
    index() {
        return 'x';
    }
}

describe('hasDecoratorMeta', () => {
    it('should be true for an instance of a decorated class', () => {
        expect(hasDecoratorMeta(new DecoratedController())).toBe(true);
    });

    it('should be true for a decorated class', () => {
        expect(hasDecoratorMeta(DecoratedController)).toBe(true);
    });

    it('should be false for a plain object without writing an entry', () => {
        const target = {};

        expect(hasDecoratorMeta(target)).toBe(false);
        expect(Object.getOwnPropertySymbols(target)).toEqual([]);
    });

    it('should be false for an instance of an undecorated class without writing an entry', () => {
        const target = new PlainClass();

        expect(hasDecoratorMeta(target)).toBe(false);
        expect(Object.getOwnPropertySymbols(target)).toEqual([]);
        expect(Object.getOwnPropertySymbols(PlainClass.prototype)).toEqual([]);
    });

    it('should be false for an arrow function', () => {
        expect(hasDecoratorMeta(() => {})).toBe(false);
    });

    it('should be false for a bound function', () => {
        expect(hasDecoratorMeta(PlainClass.prototype.index.bind(null))).toBe(false);
    });

    it('should be false for an undecorated class without writing an entry', () => {
        expect(hasDecoratorMeta(PlainClass)).toBe(false);
        expect(Object.getOwnPropertySymbols(PlainClass)).toEqual([]);
        expect(Object.getOwnPropertySymbols(PlainClass.prototype)).toEqual([]);
    });
});
