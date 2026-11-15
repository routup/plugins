import { describe, expect, it } from 'vitest';
import { query } from '@routup/query';
import { App } from 'routup';
import {
    DController,
    DGet,
    DQuery,
    DStatus,
    decorators,
} from '../../src';

@DController('/prototype')
class PrototypeController {
    @DGet('to-string')
    @DStatus(201)
    toString(
        @DQuery('name') name?: string,
    ): string {
        return `to-string:${name}`;
    }
}

class UndecoratedController {
    name = 'undecorated';
}

describe('method names of Object.prototype members', () => {
    it('should mount a decorated method named toString', async () => {
        const router = new App();

        router.use(query());
        router.use(decorators({ controllers: [PrototypeController] }));

        const response = await router.fetch(new Request('http://localhost/prototype/to-string?name=foo'));

        expect(response.status).toEqual(201);
        expect(await response.text()).toEqual('to-string:foo');
    });

    it('should not write decorator options onto an inherited toString', () => {
        const instance = new UndecoratedController();

        expect(Object.hasOwn(instance.toString, 'status')).toBe(false);
        expect(Object.hasOwn(Object.prototype.toString, 'status')).toBe(false);
        expect(Object.prototype.toString.call(instance)).toEqual('[object Object]');
    });
});
