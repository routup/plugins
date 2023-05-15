import type { ClassType } from '../type';
import { useDecoratorMeta } from '../utils';

export function createClassDecorator(
    url: string,
    middlewares?: ClassType[],
) : ClassDecorator {
    return (target: any) : void => {
        const meta = useDecoratorMeta(target.prototype);

        meta.url = url;
        meta.middlewares = [];

        if (Array.isArray(middlewares)) {
            meta.middlewares = [
                ...meta.middlewares,
                ...middlewares,
            ];
        }
    };
}

export function DController(
    url: string,
    middlewares?: ClassType[],
) : ClassDecorator {
    return createClassDecorator(url, middlewares);
}
