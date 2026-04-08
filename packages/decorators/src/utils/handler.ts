import type { CoreHandlerOptions } from 'routup';
import { defineCoreHandler } from 'routup';
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
    options: Partial<CoreHandlerOptions>,
) {
    return defineCoreHandler({
        ...options,
        fn: (event) => {
            const middle = new (item as ClassType)();

            if (isHandlerClassInstance(middle)) {
                return middle.run(event);
            }

            /* istanbul ignore next */
            return middle(event);
        },
    });
}
