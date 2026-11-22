// eslint-disable-next-line max-classes-per-file
import { describe, expect, it } from 'vitest';
import { body } from '@routup/body';
import { App } from 'routup';
import {
    DBody,
    DConsumes,
    DController,
    DGet,
    DPost,
    DPut,
    decorators,
    useDecoratorMeta,
} from '../../src';

@DController('/items')
@DConsumes('application/json')
class ItemController {
    @DGet('/')
    list() {
        return [];
    }

    @DPost('/')
    create(@DBody() body: unknown) {
        return body;
    }

    @DPut('/')
    @DConsumes('application/*+xml')
    replace() {
        return 'replaced';
    }
}

@DController('/free')
class FreeController {
    @DPost('/')
    create() {
        return 'created';
    }
}

function createApp() {
    const app = new App();

    app.use(body());
    app.use(decorators({ controllers: [ItemController, FreeController] }));

    return app;
}

function send(app: App, method: string, path: string, contentType?: string) {
    return app.fetch(new Request(`http://localhost${path}`, {
        method,
        body: '{"a":1}',
        headers: contentType ? { 'content-type': contentType } : {},
    }));
}

describe('DConsumes', () => {
    it('should accept a listed media type, ignoring parameters and case', async () => {
        const app = createApp();

        let response = await send(app, 'POST', '/items', 'application/json; charset=utf-8');

        expect(response.status).toEqual(200);
        expect(await response.json()).toEqual({ a: 1 });

        response = await send(app, 'POST', '/items', 'Application/JSON');
        expect(response.status).toEqual(200);
    });

    it('should answer 415 for an unlisted media type', async () => {
        const response = await send(createApp(), 'POST', '/items', 'text/plain');

        expect(response.status).toEqual(415);
    });

    it('should answer 415 for a body without content-type', async () => {
        const app = createApp();
        const response = await app.fetch(new Request('http://localhost/items', {
            method: 'POST',
            body: new Uint8Array([1]),
        }));

        expect(response.status).toEqual(415);
    });

    it('should answer 400 for a malformed content-type', async () => {
        const response = await send(createApp(), 'POST', '/items', 'json');

        expect(response.status).toEqual(400);
    });

    it('should not check a request without a body', async () => {
        const response = await createApp().fetch(new Request('http://localhost/items'));

        expect(response.status).toEqual(200);
    });

    it('should accept the class and the method media types together', async () => {
        const app = createApp();

        let response = await send(app, 'PUT', '/items', 'application/atom+xml');

        expect(response.status).toEqual(200);

        response = await send(app, 'PUT', '/items', 'application/json');
        expect(response.status).toEqual(200);

        response = await send(app, 'PUT', '/items', 'text/xml');
        expect(response.status).toEqual(415);
    });

    it('should not check a controller without the decorator', async () => {
        const response = await send(createApp(), 'POST', '/free', 'text/plain');

        expect(response.status).toEqual(200);
    });

    it('should let a subclass add media types without changing the parent', async () => {
        @DController('/child')
        class ChildController extends ItemController {
            @DPost('/')
            @DConsumes('text/plain')
            override create(@DBody() body: unknown) {
                return body;
            }
        }

        const app = new App();

        app.use(body());
        app.use(decorators({ controllers: [ItemController, ChildController] }));

        expect((await send(app, 'POST', '/child', 'text/plain')).status).toEqual(200);
        expect((await send(app, 'POST', '/child', 'application/json')).status).toEqual(200);
        expect((await send(app, 'POST', '/items', 'text/plain')).status).toEqual(415);
        expect(useDecoratorMeta(ItemController.prototype).consumes).toEqual(['application/json']);
    });
});
