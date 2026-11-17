import { describe, expect, it } from 'vitest';
import type { DecoratorParameterOptions } from '../../src';
import { buildDecoratorMethodArguments } from '../../src';

function createEvent(log: string[]) : any {
    return {
        get params() {
            log.push('param');

            return { id: '1' };
        },
        get headers() {
            log.push('header');

            return new Headers({ 'x-a': 'a' });
        },
        get request() {
            log.push('request');

            return 'request';
        },
        get store() {
            log.push('query');

            return {};
        },
    };
}

describe('buildDecoratorMethodArguments', () => {
    it('runs the last declaration of each index, in list order', async () => {
        const log : string[] = [];
        const parameters : DecoratorParameterOptions[] = [
            { index: 1, type: 'query' },
            { index: 0, type: 'param' },
            { index: 1, type: 'header' },
        ];

        const items = await buildDecoratorMethodArguments({ event: createEvent(log) }, parameters);

        expect(log).toEqual(['param', 'header']);
        expect(items[0]).toEqual({ id: '1' });
        expect(items[1]).toBeInstanceOf(Headers);
    });

    it('runs a list without duplicate indexes in list order', async () => {
        const log : string[] = [];
        const parameters : DecoratorParameterOptions[] = [
            { index: 2, type: 'request' },
            { index: 0, type: 'header' },
            { index: 1, type: 'param' },
        ];

        const items = await buildDecoratorMethodArguments({ event: createEvent(log) }, parameters);

        expect(log).toEqual(['request', 'header', 'param']);
        expect(items[2]).toEqual('request');
    });

    it('compares indexes as property keys, as an array assignment does', async () => {
        const log : string[] = [];
        const parameters = [
            { index: 0, type: 'param' },
            { index: '0', type: 'request' },
        ] as unknown as DecoratorParameterOptions[];

        const items = await buildDecoratorMethodArguments({ event: createEvent(log) }, parameters);

        expect(log).toEqual(['request']);
        expect(items).toEqual(['request']);
    });
});
