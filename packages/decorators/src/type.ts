import type { Next, Request, Response } from 'routup';
import type { DecoratorMethodOptions } from './method';
import type { DecoratorParameterOptions } from './parameter';

// eslint-disable-next-line @typescript-eslint/ban-types
export interface ClassType extends Function {
    new(...args: any[]): any;
}

export type DecoratorMeta = {
    url: string,

    methods: {
        [key: string]: DecoratorMethodOptions
    },

    middlewares: ClassType[],

    parameters: {
        [key: string]: DecoratorParameterOptions[]
    }
};

export interface HandlerInterface {
    run(request: Request, response: Response, next: Next): Promise<void> | void;
}
