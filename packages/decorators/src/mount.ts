import type { IRouter, MethodName } from 'routup';
import { Router, defineCoreHandler } from 'routup';
import { buildDecoratorMethodArguments } from './method';
import type { ClassType } from './type';
import { createHandlerForClassType, isObject, useDecoratorMeta } from './utils';

export function mountController(
    router: IRouter,
    input: (ClassType | Record<string, any>),
) {
    let controller : Record<string, any>;

    if (isObject(input)) {
        controller = input;
    } else {
        controller = new (input as ClassType)();
    }

    const meta = useDecoratorMeta(controller);

    const childRouter = new Router();

    for (let i = 0; i < meta.middlewares.length; i++) {
        const handler = createHandlerForClassType(meta.middlewares[i]!, {});

        childRouter.use(handler);
    }

    const propertyKeys = Object.keys(meta.methods);
    for (const propertyKey of propertyKeys) {
        const method = meta.methods[propertyKey];
        if (!method) {
            continue;
        }

        if (method.middlewares) {
            for (let i = 0; i < method.middlewares.length; i++) {
                childRouter.use(createHandlerForClassType(
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

                return controller[propertyKey](...args);
            },
        });

        childRouter.use(handler);
    }

    router.use(meta.url, childRouter);
}

export function mountControllers(
    router: IRouter,
    input: (ClassType | Record<string, any>)[],
) {
    for (const element of input) {
        mountController(router, element);
    }
}
