import type { ClassType } from '../type';
import { useDecoratorMeta } from '../utils';

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
