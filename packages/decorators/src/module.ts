import type { Handler } from 'routup';
import { Router, isObject } from 'routup';
import { buildDecoratorMethodArguments } from './method';
import type { ClassType } from './type';
import { createHandlerForClassType, useDecoratorMeta } from './utils';

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
        const handler = createHandlerForClassType(meta.middlewares[i]);

        childRouter.use(handler);
    }

    const propertyKeys = Object.keys(meta.methods);
    for (let i = 0; i < propertyKeys.length; i++) {
        const handler : Handler = (req, res, next) => controller[propertyKeys[i]].apply(controller, [
            ...buildDecoratorMethodArguments(req, res, next, meta.parameters[propertyKeys[i]]),
        ]);

        const method = meta.methods[propertyKeys[i]];
        const handlers : Handler[] = [];
        if (method.middlewares) {
            for (let i = 0; i < method.middlewares.length; i++) {
                handlers.push(createHandlerForClassType(method.middlewares[i]));
            }
        }

        (childRouter as any)[method.method].apply(childRouter, [
            method.url,
            ...handlers,
            handler,
        ]);
    }

    router.use(meta.url, childRouter);
}

export function mountControllers(router: Router, input: (ClassType | Record<string, any>)[]) {
    for (let i = 0; i < input.length; i++) {
        mountController(router, input[i]);
    }
}
