import type { ClassType } from '../types';
import { setDecoratorController } from '../utils/meta';

export function createClassDecorator(
    url: string | string[],
    middlewares?: ClassType[],
) : ClassDecorator {
    return (target: any) : void => {
        setDecoratorController(target.prototype, url, middlewares);
    };
}

export function DController(
    url: string | string[],
    middlewares?: ClassType[],
) : ClassDecorator {
    return createClassDecorator(url, middlewares);
}
