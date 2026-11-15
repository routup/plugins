import type { ClassType } from '../types';
import { useDecoratorMeta, useDecoratorResponseOptions } from '../utils';

export function createMethodDecorator(
    method: string,
    url: string,
    handlers?: ClassType[],
) : MethodDecorator {
    return (
        target: any,
        propertyKey: string | symbol,
        descriptor: TypedPropertyDescriptor<any>,
    ) : void => {
        /* istanbul ignore next */
        if (typeof propertyKey !== 'string') {
            return;
        }

        const meta = useDecoratorMeta(target);

        meta.methods[propertyKey] = {
            method,
            url,
            middlewares: handlers || [],
        };
    };
}

export function DDelete(url: string, handlers?: ClassType[]) : MethodDecorator {
    return createMethodDecorator('delete', url, handlers);
}

export function DGet(url: string, handlers?: ClassType[]) : MethodDecorator {
    return createMethodDecorator('get', url, handlers);
}

export function DPost(url: string, handlers?: ClassType[]) : MethodDecorator {
    return createMethodDecorator('post', url, handlers);
}

export function DPut(url: string, handlers?: ClassType[]) : MethodDecorator {
    return createMethodDecorator('put', url, handlers);
}

export function DPatch(url: string, handlers?: ClassType[]) : MethodDecorator {
    return createMethodDecorator('patch', url, handlers);
}

/**
 * Declare the status a method answers with on success.
 *
 * The status is applied to `event.response` before the method runs, so a
 * status the method sets itself, or a returned `Response`, still wins.
 * The `@routup/decorators/preset` documents the return type under this
 * status; pass a three-digit numeric literal, since trapi cannot resolve
 * imported constants.
 *
 * @param status - HTTP status code, e.g. `201` or `202`.
 */
export function DStatus(status: number) : MethodDecorator {
    return (
        target: any,
        propertyKey: string | symbol,
    ) : void => {
        /* istanbul ignore next */
        if (typeof propertyKey !== 'string') {
            return;
        }

        useDecoratorResponseOptions(target, propertyKey).status = status;
    };
}
