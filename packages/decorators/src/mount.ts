import type { MethodName } from 'routup';
import { Router, coreHandler } from 'routup';
import { buildDecoratorMethodArguments } from './method';
import type { ClassType } from './type';
import { createHandlerForClassType, isObject, useDecoratorMeta } from './utils';

export function mountController(router: Router, input: (ClassType | Record<string, any>)) {
    let controller : Record<string, any>;

    if (isObject(input)) {
        controller = input;
    } else {
        controller = new (input as ClassType)();
    }

    const meta = useDecoratorMeta(controller);

    const childRouter = new Router();

    for (let i = 0; i < meta.middlewares.length; i++) {
        const handler = createHandlerForClassType(meta.middlewares[i], {});

        childRouter.use(handler);
    }

    const propertyKeys = Object.keys(meta.methods);
    for (let i = 0; i < propertyKeys.length; i++) {
        const method = meta.methods[propertyKeys[i]];
        if (method.middlewares) {
            for (let i = 0; i < method.middlewares.length; i++) {
                childRouter.use(createHandlerForClassType(
                    method.middlewares[i],
                    {
                        method: method.method as MethodName,
                        path: method.url,
                    },
                ));
            }
        }

        const handler = coreHandler({
            method: method.method as MethodName,
            path: method.url,
            fn: (
                req,
                res,
                next,
            ) => controller[propertyKeys[i]].apply(controller, [
                ...buildDecoratorMethodArguments(req, res, next, meta.parameters[propertyKeys[i]]),
            ]),
        });

        childRouter.use(handler);
    }

    router.use(meta.url, childRouter);
}

export function mountControllers(router: Router, input: (ClassType | Record<string, any>)[]) {
    for (let i = 0; i < input.length; i++) {
        mountController(router, input[i]);
    }
}
