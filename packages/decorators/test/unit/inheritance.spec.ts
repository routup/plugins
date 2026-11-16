// eslint-disable-next-line max-classes-per-file
import { describe, expect, it } from 'vitest';
import { query } from '@routup/query';
import { App } from 'routup';
import type { ClassType, HandlerInterface } from '../../src';
import {
    DController,
    DGet,
    DPost,
    DProduces,
    DQuery,
    DStatus,
    getControllerRoutes,
    hasDecoratorMeta,
    mountController,
    mountControllers,
    useDecoratorMeta,
    useDecoratorResponseOptions,
} from '../../src';

const symbol = Symbol.for('@routup/decorators:DecoratorMeta');

class FirstMiddleware implements HandlerInterface {
    run() {
        return undefined;
    }
}

class SecondMiddleware implements HandlerInterface {
    run() {
        return undefined;
    }
}

function metaOf(input: ClassType) {
    return useDecoratorMeta(input.prototype);
}

function fetch(app: App, path: string, method = 'GET') {
    return app.fetch(new Request(`http://localhost${path}`, { method }));
}

class Base {
    @DGet('/health')
    health() {
        return 'ok';
    }
}

@DController('/users')
class Users extends Base {
    @DGet('/list')
    list() {
        return 'users';
    }
}

@DController('/roles')
class Roles extends Base {
    @DGet('/all')
    all() {
        return 'roles';
    }
}

describe('a decorated subclass', () => {
    it('lists the inherited and its own routes under its own base path', () => {
        expect(getControllerRoutes(Users)).toEqual([
            { method: 'GET', path: '/users/health' },
            { method: 'GET', path: '/users/list' },
        ]);
        expect(getControllerRoutes(Roles)).toEqual([
            { method: 'GET', path: '/roles/health' },
            { method: 'GET', path: '/roles/all' },
        ]);
    });

    it('leaves the metadata of the parent as the parent declared it', () => {
        const meta = metaOf(Base);

        expect(meta.url).toEqual('');
        expect(Object.keys(meta.methods)).toEqual(['health']);
    });

    it('serves each subclass with its own routes only', async () => {
        const app = new App();

        mountControllers(app, [Users, Roles]);

        expect(await (await fetch(app, '/users/health')).text()).toEqual('ok');
        expect(await (await fetch(app, '/users/list')).text()).toEqual('users');
        expect(await (await fetch(app, '/roles/health')).text()).toEqual('ok');
        expect(await (await fetch(app, '/roles/all')).text()).toEqual('roles');

        expect((await fetch(app, '/users/all')).status).toEqual(404);
        expect((await fetch(app, '/roles/list')).status).toEqual(404);
    });
});

describe('a decorated subclass of a controller', () => {
    @DController('/parent')
    class Parent {
        @DGet('/a')
        a() {
            return 'a';
        }
    }

    @DController('/child')
    class Child extends Parent {
        @DGet('/b')
        b() {
            return 'b';
        }
    }

    it('keeps the parent unchanged', () => {
        expect(metaOf(Parent).url).toEqual('/parent');
        expect(getControllerRoutes(Parent)).toEqual([
            { method: 'GET', path: '/parent/a' },
        ]);
    });

    it('lists and serves the parent methods and its own under its base path', async () => {
        expect(getControllerRoutes(Child)).toEqual([
            { method: 'GET', path: '/child/a' },
            { method: 'GET', path: '/child/b' },
        ]);

        const app = new App();

        mountControllers(app, [Parent, Child]);

        expect(await (await fetch(app, '/parent/a')).text()).toEqual('a');
        expect(await (await fetch(app, '/child/a')).text()).toEqual('a');
        expect(await (await fetch(app, '/child/b')).text()).toEqual('b');
        expect((await fetch(app, '/parent/b')).status).toEqual(404);
    });

    it('inherits every level of a three level chain', () => {
        @DController('/a')
        class A {
            @DGet('/one')
            one() {
                return 1;
            }
        }

        @DController('/b')
        class B extends A {
            @DGet('/two')
            two() {
                return 2;
            }
        }

        @DController('/c')
        class C extends B {
            @DGet('/three')
            three() {
                return 3;
            }
        }

        expect(getControllerRoutes(A)).toEqual([
            { method: 'GET', path: '/a/one' },
        ]);
        expect(getControllerRoutes(B)).toEqual([
            { method: 'GET', path: '/b/one' },
            { method: 'GET', path: '/b/two' },
        ]);
        expect(getControllerRoutes(C)).toEqual([
            { method: 'GET', path: '/c/one' },
            { method: 'GET', path: '/c/two' },
            { method: 'GET', path: '/c/three' },
        ]);
    });

    it('keeps the maps keyed by method name prototype-less', () => {
        const meta = metaOf(Child);

        expect(Object.hasOwn(Child.prototype, symbol)).toBe(true);
        expect(Object.getPrototypeOf(meta.methods)).toBeNull();
        expect(Object.getPrototypeOf(meta.responses)).toBeNull();
        expect(Object.getPrototypeOf(meta.parameters)).toBeNull();
    });
});

describe('isolation of every inherited entry', () => {
    @DController(['/parent', '/other'], [FirstMiddleware])
    @DProduces('text/plain')
    class Parent {
        @DGet('/item', [FirstMiddleware])
        @DStatus(201)
        @DProduces('text/csv')
        item(@DQuery('a') a?: string) {
            return a;
        }
    }

    function expectParentUnchanged() {
        const meta = metaOf(Parent);

        expect(meta.url).toEqual(['/parent', '/other']);
        expect(meta.middlewares).toEqual([FirstMiddleware]);
        expect(meta.produces).toEqual(['text/plain']);
        expect(meta.methods.item).toEqual({
            method: 'get',
            url: '/item',
            middlewares: [FirstMiddleware],
        });
        expect(meta.responses.item).toEqual({ status: 201, produces: ['text/csv'] });
        expect(meta.parameters.item).toEqual([
            {
                index: 0,
                property: 'a',
                type: 'query',
            },
        ]);
    }

    it('copies the base path, class middlewares and class media types', () => {
        @DController('/child', [SecondMiddleware])
        @DProduces('application/json')
        class Child extends Parent {}

        @DController('/sibling')
        class Sibling extends Parent {}

        @DController('/bare', [])
        class Bare extends Parent {}

        expectParentUnchanged();

        // An empty array replaces the inherited middlewares as well.
        expect(metaOf(Bare).middlewares).toEqual([]);

        expect(metaOf(Child).url).toEqual('/child');
        expect(metaOf(Child).middlewares).toEqual([SecondMiddleware]);
        expect(metaOf(Child).produces).toEqual(['application/json', 'text/plain']);

        expect(metaOf(Sibling).url).toEqual('/sibling');
        expect(metaOf(Sibling).middlewares).toEqual([FirstMiddleware]);
        expect(metaOf(Sibling).produces).toEqual(['text/plain']);
    });

    it('copies the inherited base path array', () => {
        class Child extends Parent {
            @DGet('/own')
            own() {
                return 'own';
            }
        }

        (metaOf(Child).url as string[]).push('/pushed');
        metaOf(Child).middlewares.push(SecondMiddleware);

        expectParentUnchanged();
    });

    it('copies the method entries and their middlewares', () => {
        class Child extends Parent {
            @DGet('/own')
            own() {
                return 'own';
            }
        }

        class Sibling extends Parent {
            @DGet('/other')
            other() {
                return 'other';
            }
        }

        metaOf(Child).methods.item!.middlewares.push(SecondMiddleware);
        metaOf(Child).methods.item!.url = '/changed';

        expectParentUnchanged();
        expect(Object.keys(metaOf(Parent).methods)).toEqual(['item']);
        expect(Object.keys(metaOf(Sibling).methods)).toEqual(['item', 'other']);
        expect(metaOf(Sibling).methods.item!.middlewares).toEqual([FirstMiddleware]);
    });

    it('replaces the response options of a method on @DStatus and @DProduces of an override without a verb', () => {
        class Child extends Parent {
            @DStatus(202)
            @DProduces('text/html')
            override item(a?: string) {
                return a;
            }
        }

        class Sibling extends Parent {
            @DGet('/other')
            other() {
                return 'other';
            }
        }

        expectParentUnchanged();
        expect(metaOf(Child).responses.item).toEqual({
            status: 202,
            produces: ['text/html'],
        });
        // the inherited route stays
        expect(metaOf(Child).methods.item).toEqual(metaOf(Parent).methods.item);
        expect(metaOf(Sibling).responses.item).toEqual({ status: 201, produces: ['text/csv'] });

        metaOf(Sibling).responses.item!.produces!.push('text/xml');

        expectParentUnchanged();
    });

    it('copies the parameter entries on a parameter decorator of a subclass', () => {
        class Child extends Parent {
            @DGet('/own')
            own(@DQuery('b') b?: string) {
                return b;
            }
        }

        class Sibling extends Parent {
            @DGet('/other')
            other() {
                return 'other';
            }
        }

        expectParentUnchanged();
        expect(metaOf(Child).parameters.own).toEqual([
            {
                index: 0,
                property: 'b',
                type: 'query',
            },
        ]);
        expect(metaOf(Parent).parameters.own).toBeUndefined();

        metaOf(Sibling).parameters.item!.push({ index: 1, type: 'body' });
        metaOf(Sibling).parameters.item![0]!.property = 'changed';
        metaOf(Sibling).produces.push('text/xml');

        expectParentUnchanged();
    });
});

describe('overriding a method', () => {
    @DController('/parent')
    class Parent {
        @DGet('/item')
        item(@DQuery('a') a?: string) {
            return `parent:${a}`;
        }
    }

    it('replaces the inherited route when the override has a verb decorator', async () => {
        @DController('/child')
        class Child extends Parent {
            @DPost('/thing')
            override item(a?: string) {
                return `child:${typeof a}`;
            }
        }

        expect(getControllerRoutes(Parent)).toEqual([
            { method: 'GET', path: '/parent/item' },
        ]);
        expect(getControllerRoutes(Child)).toEqual([
            { method: 'POST', path: '/child/thing' },
        ]);

        const app = new App();

        app.use(query());
        mountControllers(app, [Parent, Child]);

        // The override declares no parameter decorators, so the inherited
        // ones do not apply: like any such method, it receives the event.
        expect(metaOf(Child).parameters.item ?? []).toEqual([]);
        expect(await (await fetch(app, '/child/thing?a=x', 'POST')).text()).toEqual('child:object');
        expect((await fetch(app, '/child/item')).status).toEqual(404);
        expect(await (await fetch(app, '/parent/item?a=x')).text()).toEqual('parent:x');
    });

    it('replaces the inherited parameter decorators by the ones of the override', async () => {
        @DController('/child')
        class Child extends Parent {
            @DGet('/item')
            override item(@DQuery('b') b?: string) {
                return `child:${b}`;
            }
        }

        expect(metaOf(Child).parameters.item).toEqual([
            {
                index: 0,
                property: 'b',
                type: 'query',
            },
        ]);
        expect(metaOf(Parent).parameters.item).toEqual([
            {
                index: 0,
                property: 'a',
                type: 'query',
            },
        ]);

        const app = new App();

        app.use(query());
        mountController(app, Child);

        expect(await (await fetch(app, '/child/item?a=x&b=y')).text()).toEqual('child:y');
    });

    it('keeps the inherited route for an override with parameter decorators only, using its parameters', async () => {
        @DController('/child')
        class Child extends Parent {
            override item(@DQuery('b') b?: string) {
                return `child:${b}`;
            }
        }

        expect(getControllerRoutes(Child)).toEqual([
            { method: 'GET', path: '/child/item' },
        ]);

        const app = new App();

        app.use(query());
        mountController(app, Child);

        expect(await (await fetch(app, '/child/item?a=x&b=y')).text()).toEqual('child:y');
    });

    it('keeps the inherited route for an undecorated override, calling the override', async () => {
        @DController('/child')
        class Child extends Parent {
            override item(a?: string) {
                return `child:${a}`;
            }
        }

        expect(getControllerRoutes(Child)).toEqual([
            { method: 'GET', path: '/child/item' },
        ]);

        const app = new App();

        app.use(query());
        mountController(app, Child);

        expect(await (await fetch(app, '/child/item?a=x')).text()).toEqual('child:x');
    });
});

describe('inherited metadata of an older package copy', () => {
    it('should copy it, filled up, when a decorator runs on the subclass', async () => {
        const legacy = {
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
        };
        const parent = {
            hello() {
                return 'hello';
            },
            [symbol]: legacy,
        };

        // A class of an older package copy: its prototype is the parent.
        function LegacyController() {}
        LegacyController.prototype = parent;

        class Child extends (LegacyController as unknown as ClassType) {
            created() {
                return 'created';
            }
        }

        const descriptor = Object.getOwnPropertyDescriptor(Child.prototype, 'created')!;

        DGet('/created')(Child.prototype, 'created', descriptor);
        DStatus(201)(Child.prototype, 'created', descriptor);

        expect(Object.keys(legacy.methods)).toEqual(['hello']);
        expect(Object.keys((legacy as Record<string, any>).responses)).toEqual([]);

        const app = new App();

        mountControllers(app, [Child]);

        expect(await (await fetch(app, '/legacy/hello')).text()).toEqual('hello');

        const response = await fetch(app, '/legacy/created');

        expect(response.status).toEqual(201);
        expect(await response.text()).toEqual('created');
    });
});

describe('response options of an override', () => {
    @DController('/parent')
    class Parent {
        @DGet('/item')
        @DStatus(201)
        @DProduces('text/csv')
        item() {
            return 'parent';
        }
    }

    it('drops the inherited ones when the override has a verb decorator and none of its own', async () => {
        @DController('/child')
        class Child extends Parent {
            @DPost('/item')
            override item() {
                return 'child';
            }
        }

        expect(metaOf(Child).responses.item ?? {}).toEqual({});
        expect(metaOf(Parent).responses.item).toEqual({ status: 201, produces: ['text/csv'] });

        const app = new App();

        mountControllers(app, [Parent, Child]);

        const child = await fetch(app, '/child/item', 'POST');

        expect(child.status).toEqual(200);
        expect(child.headers.get('content-type')).not.toEqual('text/csv');

        const parent = await fetch(app, '/parent/item');

        expect(parent.status).toEqual(201);
        expect(parent.headers.get('content-type')).toEqual('text/csv');
    });

    it('uses only its own when the override declares them, whatever the decorator order', async () => {
        @DController('/before')
        class Before extends Parent {
            @DPost('/item')
            @DStatus(202)
            override item() {
                return 'before';
            }
        }

        @DController('/after')
        class After extends Parent {
            @DStatus(202)
            @DPost('/item')
            override item() {
                return 'after';
            }
        }

        expect(metaOf(Before).responses.item).toEqual({ status: 202 });
        expect(metaOf(After).responses.item).toEqual({ status: 202 });

        const app = new App();

        mountControllers(app, [Before, After]);

        expect((await fetch(app, '/before/item', 'POST')).status).toEqual(202);
        expect((await fetch(app, '/after/item', 'POST')).status).toEqual(202);
    });

    it('keeps the inherited ones for an undecorated override', async () => {
        @DController('/child')
        class Child extends Parent {
            override item() {
                return 'child';
            }
        }

        const app = new App();

        mountController(app, Child);

        const response = await fetch(app, '/child/item');

        expect(response.status).toEqual(201);
        expect(response.headers.get('content-type')).toEqual('text/csv');
        expect(await response.text()).toEqual('child');
    });
});

describe('an undecorated subclass', () => {
    @DController('/parent')
    class Parent {
        @DGet('/a')
        a() {
            return 'a';
        }
    }

    class Child extends Parent {}

    it('is listed and mounted as the parent without gaining metadata of its own', async () => {
        const instance = new Child();

        expect(hasDecoratorMeta(Child)).toBe(true);
        expect(hasDecoratorMeta(instance)).toBe(true);

        expect(getControllerRoutes(Child)).toEqual(getControllerRoutes(Parent));
        expect(getControllerRoutes(instance)).toEqual(getControllerRoutes(Parent));

        const app = new App();

        mountControllers(app, [Child, instance]);

        expect(await (await fetch(app, '/parent/a')).text()).toEqual('a');

        expect(useDecoratorMeta(instance)).toBe(metaOf(Parent));

        expect(Object.hasOwn(Child.prototype, symbol)).toBe(false);
        expect(Object.hasOwn(instance, symbol)).toBe(false);
    });
});

describe('useDecoratorMeta() and useDecoratorResponseOptions()', () => {
    @DController('/parent')
    class Parent {
        @DGet('/item')
        @DStatus(201)
        item() {
            return 'parent';
        }
    }

    it('give a subclass prototype its own copy, so a custom decorator changes only the subclass', () => {
        class Child extends Parent {}

        const meta = useDecoratorMeta(Child.prototype);

        expect(Object.hasOwn(Child.prototype, symbol)).toBe(true);
        expect(meta).not.toBe(metaOf(Parent));

        meta.url = '/child';
        meta.methods.item!.middlewares.push(SecondMiddleware);

        expect(metaOf(Parent).url).toEqual('/parent');
        expect(metaOf(Parent).methods.item!.middlewares).toEqual([]);
        expect(getControllerRoutes(Child)).toEqual([
            { method: 'GET', path: '/child/item' },
        ]);
    });

    it('resolve the inherited response options of an instance without writing', async () => {
        class Child extends Parent {}

        const parent = new Parent();
        const child = new Child();

        expect(useDecoratorResponseOptions(parent, 'item').status).toEqual(201);
        expect(useDecoratorResponseOptions(child, 'item').status).toEqual(201);

        expect(Object.hasOwn(parent, symbol)).toBe(false);
        expect(Object.hasOwn(child, symbol)).toBe(false);
        expect(Object.hasOwn(Child.prototype, symbol)).toBe(false);

        const app = new App();

        mountControllers(app, [parent]);

        expect((await fetch(app, '/parent/item')).status).toEqual(201);
    });

    it('resolve the response options of a forked subclass instance without replacing them', () => {
        @DController('/child')
        class Child extends Parent {}

        expect(useDecoratorResponseOptions(new Child(), 'item').status).toEqual(201);
        expect(metaOf(Child).responses.item!.status).toEqual(201);
    });
});

describe('the mark of an inherited entry', () => {
    it('is seen by every package copy, as it is a global symbol on the entry', () => {
        // A subclass whose metadata another copy of the package forked.
        class Child {
            item(b?: string) {
                return b;
            }
        }

        const inherited = [{
            index: 0, 
            property: 'a', 
            type: 'query' as const, 
        }];

        Object.defineProperty(inherited, Symbol.for('@routup/decorators:Inherited'), { value: true });

        const meta = useDecoratorMeta(Child.prototype);

        meta.parameters.item = inherited;

        DQuery('b')(Child.prototype, 'item', 0);

        expect(metaOf(Child).parameters.item).toEqual([
            {
                index: 0, 
                property: 'b', 
                type: 'query', 
            },
        ]);
    });
});

describe('@DController middlewares', () => {
    it('resets them on a class without a parent, as each application sets them', () => {
        @DController('/a')
        @DController('/b', [FirstMiddleware])
        class Twice {}

        expect(metaOf(Twice).url).toEqual('/a');
        expect(metaOf(Twice).middlewares).toEqual([]);
    });

    it('keeps the inherited ones without an argument, and replaces them with an array', () => {
        @DController('/parent', [FirstMiddleware])
        class Parent {}

        @DController('/keep')
        class Keep extends Parent {}

        @DController('/replace', [SecondMiddleware])
        class Replace extends Parent {}

        @DController('/none', [])
        class None extends Parent {}

        expect(metaOf(Keep).middlewares).toEqual([FirstMiddleware]);
        expect(metaOf(Replace).middlewares).toEqual([SecondMiddleware]);
        expect(metaOf(None).middlewares).toEqual([]);
        expect(metaOf(Parent).middlewares).toEqual([FirstMiddleware]);
    });
});
