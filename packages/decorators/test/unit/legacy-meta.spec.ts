import { describe, expect, it } from 'vitest';
import { App } from 'routup';
import { DGet, DStatus, mountControllers } from '../../src';

const symbol = Symbol.for('@routup/decorators:DecoratorMeta');

describe('metadata of an older package copy', () => {
    it('should mount a controller whose metadata lacks responses and produces', async () => {
        // The shape an older copy of the package (sharing the global
        // symbol) writes on the controller prototype.
        const prototype = {
            hello() {
                return { hello: 'world' };
            },
            [symbol]: {
                url: '/legacy',
                middlewares: [],
                methods: {
                    hello: {
                        method: 'get',
                        url: '/hello',
                        middlewares: [],
                    },
                },
                parameters: {},
            },
        };

        const router = new App();

        mountControllers(router, [Object.create(prototype)]);

        const response = await router.fetch(new Request('http://localhost/legacy/hello'));

        expect(response.status).toEqual(200);
        expect(await response.json()).toEqual({ hello: 'world' });
    });

    it('should let a decorator of this copy add to metadata of an older copy', async () => {
        const prototype = {
            created() {
                return 'created';
            },
            [symbol]: {
                url: '/legacy',
                middlewares: [],
                methods: {},
                parameters: {},
            },
        };

        const descriptor = Object.getOwnPropertyDescriptor(prototype, 'created')!;

        DGet('created')(prototype, 'created', descriptor);
        DStatus(201)(prototype, 'created', descriptor);

        const router = new App();

        mountControllers(router, [Object.create(prototype)]);

        const response = await router.fetch(new Request('http://localhost/legacy/created'));

        expect(response.status).toEqual(201);
        expect(await response.text()).toEqual('created');
    });
});
