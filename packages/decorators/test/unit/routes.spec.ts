// eslint-disable-next-line max-classes-per-file
import { describe, expect, it } from 'vitest';
import type { HandlerInterface } from '../../src';
import { App } from 'routup';
import {
    DController,
    DDelete,
    DGet,
    DPost,
    decorators,
    getControllerRoutes,
    mountController,
} from '../../src';

class PassMiddleware implements HandlerInterface {
    run() {
        return undefined;
    }
}

@DController('/notes')
class NoteController {
    @DGet('')
    list() {
        return 'list';
    }

    @DPost('/:id')
    update() {
        return 'update';
    }
}

@DController(['/a', '/b'])
class MultiPathController {
    @DGet('')
    list() {
        return 'list';
    }

    @DGet('/:id')
    show() {
        return 'show';
    }
}

@DController('')
class RootController {
    @DGet('')
    index() {
        return 'index';
    }
}

@DController('/guarded', [PassMiddleware])
class MiddlewareController {
    @DGet('/x', [PassMiddleware])
    show() {
        return 'x';
    }
}

class PlainController {
    @DGet('/x')
    show() {
        return 'x';
    }
}

@DController('/users')
class SegmentController {
    @DGet(':id')
    show() {
        return 'show';
    }

    @DDelete('-:id')
    remove() {
        return 'remove';
    }

    @DGet('{:name}')
    optional() {
        return 'optional';
    }
}

class SubNoteController extends NoteController {}

@DController('/notes')
class SlashGroupController {
    @DGet('{/:id}')
    show() {
        return 'show';
    }
}

@DController('/notes')
class LeadingSlashGroupController {
    @DGet('/{/:id}')
    show() {
        return 'show';
    }
}

function toRequest(method: string, path: string): Request {
    return new Request(`http://localhost${path}`, { method });
}

describe('getControllerRoutes', () => {
    it('lists one entry per method in declaration order', () => {
        expect(getControllerRoutes(NoteController)).toEqual([
            { method: 'GET', path: '/notes' },
            { method: 'POST', path: '/notes/:id' },
        ]);
    });

    it('lists the methods under every base path, base path first', () => {
        expect(getControllerRoutes(MultiPathController)).toEqual([
            { method: 'GET', path: '/a' },
            { method: 'GET', path: '/a/:id' },
            { method: 'GET', path: '/b' },
            { method: 'GET', path: '/b/:id' },
        ]);
    });

    it('lists an empty method path as the base path', () => {
        expect(getControllerRoutes(RootController)).toEqual([
            { method: 'GET', path: '/' },
        ]);
    });

    it('does not list class or method middlewares', () => {
        expect(getControllerRoutes(MiddlewareController)).toEqual([
            { method: 'GET', path: '/guarded/x' },
        ]);
    });

    it('answers the same for an instance and its class', () => {
        expect(getControllerRoutes(new NoteController()))
            .toEqual(getControllerRoutes(NoteController));
    });

    it('answers an empty list for an undecorated target without writing an entry', () => {
        class Undecorated {
            show() {
                return 'x';
            }
        }

        const object = {};
        const instance = new Undecorated();

        expect(getControllerRoutes(object)).toEqual([]);
        expect(getControllerRoutes(instance)).toEqual([]);
        expect(getControllerRoutes(Undecorated)).toEqual([]);

        expect(Object.getOwnPropertySymbols(object)).toEqual([]);
        expect(Object.getOwnPropertySymbols(instance)).toEqual([]);
        expect(Object.getOwnPropertySymbols(Undecorated)).toEqual([]);
        expect(Object.getOwnPropertySymbols(Undecorated.prototype)).toEqual([]);
    });

    it('lists the inherited methods of a subclass, as the mount registers them', async () => {
        expect(getControllerRoutes(SubNoteController))
            .toEqual(getControllerRoutes(NoteController));

        const app = new App();

        app.use(decorators({ controllers: [SubNoteController] }));

        const response = await app.fetch(toRequest('POST', '/notes/5'));

        expect(await response.text()).toEqual('update');
    });

    it('lists the methods of a class without @DController under the root', () => {
        expect(getControllerRoutes(PlainController)).toEqual([
            { method: 'GET', path: '/x' },
        ]);
    });

    it('lists a slash-less method path as a segment under the base path', async () => {
        expect(getControllerRoutes(SegmentController)).toEqual([
            { method: 'GET', path: '/users/:id' },
            { method: 'DELETE', path: '/users/-:id' },
            { method: 'GET', path: '/users/{:name}' },
        ]);

        const app = new App();

        app.use(decorators({ controllers: [SegmentController] }));

        const show = await app.fetch(toRequest('GET', '/users/5'));

        expect(await show.text()).toEqual('show');

        const remove = await app.fetch(toRequest('DELETE', '/users/-5'));

        expect(await remove.text()).toEqual('remove');
    });

    it('refuses a method path that starts with an optional group led by a slash', () => {
        for (const controller of [SlashGroupController, LeadingSlashGroupController]) {
            expect(() => getControllerRoutes(controller)).toThrow(/GET "\/?\{\/:id\}" under the controller path "\/notes"/);
            expect(() => mountController(new App(), controller)).toThrow(/GET "\/?\{\/:id\}" under the controller path "\/notes"/);
        }
    });

    it('lists exactly the method-bound routes the mount registers', async () => {
        const controllers = [NoteController, MultiPathController, SegmentController];

        for (const controller of controllers) {
            const app = new App();

            app.use(decorators({ controllers: [controller] }));

            const registered = app.routes
                .filter((route) => !!route.method)
                .map((route) => ({ method: route.method, path: route.path }));

            expect(getControllerRoutes(controller)).toEqual(registered);
        }

        const app = new App();

        app.use(decorators({ controllers: [MultiPathController] }));

        for (const route of getControllerRoutes(MultiPathController)) {
            const response = await app.fetch(toRequest(route.method, route.path.replace(':id', '7')));

            expect(response.status).toEqual(200);
        }

        for (const [method, path] of [['GET', '/c'], ['GET', '/a/7/x'], ['POST', '/a']]) {
            const response = await app.fetch(toRequest(method!, path!));

            expect(response.status).not.toEqual(200);
        }
    });
});
