import type { IApp, MethodName } from 'routup';
import { App, defineCoreHandler } from 'routup';
import { buildDecoratorMethodArguments } from './method';
import type { ClassType, ControllerRoute, DecoratorMeta } from './types';
import {
    createHandlerForClassType,
    hasDecoratorMeta,
    isObject,
} from './utils';
import { useResolvedDecoratorMeta } from './utils/meta';

type RegisterControllerOptions = {
    /**
     * Register the class and method middlewares (default: true). The route
     * listing leaves them out, so that the app holds only the endpoints.
     */
    middlewares?: boolean,
};

function buildControllerApp(
    controller: Record<string, any>,
    meta: DecoratorMeta,
    options: RegisterControllerOptions,
): IApp {
    const childApp: IApp = new App();
    const middlewares = options.middlewares ?? true;

    if (middlewares) {
        for (let i = 0; i < meta.middlewares.length; i++) {
            const handler = createHandlerForClassType(meta.middlewares[i]!, {});

            childApp.use(handler);
        }
    }

    const propertyKeys = Object.keys(meta.methods);

    for (const propertyKey of propertyKeys) {
        const method = meta.methods[propertyKey];

        if (!method) {
            continue;
        }

        if (middlewares && method.middlewares) {
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

/**
 * Register a controller's routes on an app. The mount and the route
 * listing both go through here, so the paths they report are joined by
 * routup itself and cannot drift.
 */
function registerController(
    router: IApp,
    controller: Record<string, any>,
    meta: DecoratorMeta,
    options: RegisterControllerOptions = {},
) : void {
    const urls = Array.isArray(meta.url) ? meta.url : [meta.url];

    const app = buildControllerApp(controller, meta, options);

    // `router.use(url, childApp)` snapshots `childApp.routes` per
    // call (flatten-on-use), so mounting the same child under
    // multiple paths needs no clone — each mount gets its own
    // copy of the routes with the right prefix.
    for (const url of urls) {
        router.use(url, app);
    }
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

    registerController(router, controller, useResolvedDecoratorMeta(controller));
}

/**
 * List the routes a controller (an instance or a class) is mounted under:
 * one entry per base path and decorated method, ordered by base path, then
 * by declaration. Only routes bound to a method are listed, so middlewares
 * and a method decorator without a method name are left out. The paths do
 * not include the path of the app the controller is mounted on. A target
 * that is not an object or a class answers an empty list.
 */
export function getControllerRoutes(
    input: (ClassType | Record<string, any>),
) : ControllerRoute[] {
    if (
        (typeof input !== 'object' && typeof input !== 'function') ||
        input === null ||
        !hasDecoratorMeta(input)
    ) {
        return [];
    }

    // A class is listed through its prototype, which carries the metadata,
    // so that its constructor never runs; the handlers are never called.
    const controller : Record<string, any> = isObject(input) ?
        input :
        (input as ClassType).prototype;

    const app: IApp = new App();

    registerController(app, controller, useResolvedDecoratorMeta(controller), { middlewares: false });

    const routes : ControllerRoute[] = [];

    for (const route of app.routes) {
        if (route.method && route.path) {
            routes.push({ method: route.method, path: route.path });
        }
    }

    return routes;
}

export function mountControllers(
    router: IApp,
    input: (ClassType | Record<string, any>)[],
) {
    for (const element of input) {
        mountController(router, element);
    }
}
