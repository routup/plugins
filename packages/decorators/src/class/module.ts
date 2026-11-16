import type { ClassType } from '../types';
import { useOwnDecoratorMeta } from '../utils/meta';

export function createClassDecorator(
    url: string | string[],
    middlewares?: ClassType[],
) : ClassDecorator {
    return (target: any) : void => {
        const meta = useOwnDecoratorMeta(target.prototype);

        meta.url = url;

        // Without middlewares, a subclass keeps the inherited ones.
        if (Array.isArray(middlewares)) {
            meta.middlewares = [...middlewares];
        }
    };
}

export function DController(
    url: string | string[],
    middlewares?: ClassType[],
) : ClassDecorator {
    return createClassDecorator(url, middlewares);
}
