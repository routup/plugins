import type { MethodName } from 'routup';
import { Router, coreHandler } from 'routup';
import { buildDecoratorMethodArguments } from './method';
import type { ClassType, ParameterExtractMap } from './type';
import { createHandlerForClassType, isObject, useDecoratorMeta } from './utils';

export function mountController(
    router: Router,
    input: (ClassType | Record<string, any>),
    extractMap?: ParameterExtractMap,
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
        const handler = createHandlerForClassType(meta.middlewares[i], {});

        childRouter.use(handler);
    }

    const propertyKeys = Object.keys(meta.methods);
    for (const propertyKey of propertyKeys) {
        const method = meta.methods[propertyKey];
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
            ) => controller[propertyKey].apply(controller, [
                ...buildDecoratorMethodArguments(
                    {
                        request: req,
                        response: res,
                        next,
                    },
                    meta.parameters[propertyKey],
                    extractMap,
                ),
            ]),
        });

        childRouter.use(handler);
    }

    router.use(meta.url, childRouter);
}

export function mountControllers(
    router: Router,
    input: (ClassType | Record<string, any>)[],
    extractMap?: ParameterExtractMap,
) {
    for (const element of input) {
        mountController(router, element, extractMap);
    }
}
