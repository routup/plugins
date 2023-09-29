import type { CoreHandler } from 'routup';
import { coreHandler } from 'routup';
import {
    isObject,
} from './object';
import type { ClassType, HandlerInterface } from '../type';

export function isHandlerClassInstance(input: unknown) : input is HandlerInterface {
    return isObject(input) &&
        typeof (input as any).run === 'function';
}

export function createHandlerForClassType(
    item: ClassType,
    options: Partial<CoreHandler>,
) {
    return coreHandler({
        ...options,
        fn: (req, res, next) => {
            try {
                const middle = new (item as ClassType)();

                if (isHandlerClassInstance(middle)) {
                    middle.run(req, res, next);
                } else {
                    /* istanbul ignore next */
                    middle(req, res, next);
                }
            } catch (e) {
                /* istanbul ignore next */
                if (e instanceof Error) {
                    next(e);
                }
            }
        },
    });
}
