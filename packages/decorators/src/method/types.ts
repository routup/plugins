import type { ClassType } from '../types';

export type DecoratorMethodOptions = {
    method: string;
    url: string;
    middlewares: ClassType[];
};
