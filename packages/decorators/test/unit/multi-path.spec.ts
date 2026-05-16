import { describe, expect, it } from 'vitest';
import { App } from 'routup';
import { DController, DGet, decorators } from '../../src';

function createTestRequest(url: string, options?: RequestInit): Request {
    const fullUrl = url.startsWith('http') ? url : `http://localhost${url}`;
    return new Request(fullUrl, options);
}

@DController(['/users', '/members'])
class MultiPathController {
    @DGet('')
    async list() {
        return 'list';
    }

    @DGet('/:id')
    async show() {
        return 'show';
    }
}

describe('multi-path controller', () => {
    it('mounts the controller under each path', async () => {
        const router = new App();
        router.use(decorators({ controllers: [MultiPathController] }));

        const users = await router.fetch(createTestRequest('/users'));
        expect(users.status).toEqual(200);
        expect(await users.text()).toEqual('list');

        const members = await router.fetch(createTestRequest('/members'));
        expect(members.status).toEqual(200);
        expect(await members.text()).toEqual('list');

        const usersId = await router.fetch(createTestRequest('/users/1'));
        expect(usersId.status).toEqual(200);
        expect(await usersId.text()).toEqual('show');

        const membersId = await router.fetch(createTestRequest('/members/2'));
        expect(membersId.status).toEqual(200);
        expect(await membersId.text()).toEqual('show');
    });
});
