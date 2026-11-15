import type { IApp, MethodName } from 'routup';
import { App, defineCoreHandler } from 'routup';
import { buildDecoratorMethodArguments } from './method';
import type { ClassType, DecoratorMeta } from './types';
import { createHandlerForClassType, isObject, useDecoratorMeta } from './utils';

function buildControllerApp(
    controller: Record<string, any>,
    meta: DecoratorMeta,
): App {
    const childApp = new App();

    for (let i = 0; i < meta.middlewares.length; i++) {
        const handler = createHandlerForClassType(meta.middlewares[i]!, {});

        childApp.use(handler);
    }

    const propertyKeys = Object.keys(meta.methods);

    for (const propertyKey of propertyKeys) {
        const method = meta.methods[propertyKey];

        if (!method) {
            continue;
        }

        if (method.middlewares) {
            for (let i = 0; i < method.middlewares.length; i++) {
                childApp.use(createHandlerForClassType(
                    method.middlewares[i]!,
                    {
                        method: method.method as MethodName,
                        path: method.url,
                    },
                ));
            }
        }

        const handler = defineCoreHandler({
            method: method.method as MethodName,
            path: method.url,
            fn: async (event) => {
                const args = await buildDecoratorMethodArguments(
                    { event },
                    meta.parameters[propertyKey] ?? [],
                );

                const response = meta.responses[propertyKey];
                const contentType = response?.produces?.[0] ?? meta.produces[0];
                const previousStatus = event.response.status;

                const result = await controller[propertyKey](...args);

                // Applied once the method answered with a value routup
                // builds the response from, so that neither an error nor a
                // handler the method handed over to with `event.next()`
                // inherits them.
                if (result === undefined || result instanceof Response) {
                    return result;
                }

                if (
                    response?.status !== undefined &&
                    event.response.status === previousStatus
                ) {
                    event.response.status = response.status;
                }

                if (contentType && !event.response.headers.has('content-type')) {
                    event.response.headers.set('content-type', contentType);
                }

                return result;
            },
        });

        childApp.use(handler);
    }

    return childApp;
}

export function mountController(
    router: IApp,
    input: (ClassType | Record<string, any>),
) {
    let controller : Record<string, any>;

    if (isObject(input)) {
        controller = input;
    } else {
        controller = new (input as ClassType)();
    }

    const meta = useDecoratorMeta(controller);

    if (Array.isArray(meta.url)) {
        const childApp = buildControllerApp(controller, meta);

        // `router.use(url, childApp)` snapshots `childApp.routes` per
        // call (flatten-on-use), so mounting the same child under
        // multiple paths needs no clone — each mount gets its own
        // copy of the routes with the right prefix.
        for (const url of meta.url) {
            router.use(url, childApp);
        }
    } else {
        router.use(meta.url, buildControllerApp(controller, meta));
    }
}

export function mountControllers(
    router: IApp,
    input: (ClassType | Record<string, any>)[],
) {
    for (const element of input) {
        mountController(router, element);
    }
}
