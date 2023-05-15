import type { ClassType } from '../type';

export type DecoratorMethodOptions = {
    method: string;
    url: string;
    middlewares: ClassType[];
};
