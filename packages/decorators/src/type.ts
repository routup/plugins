import type { Next, Request, Response } from 'routup';
import type { DecoratorMethodOptions } from './method';
import type { DecoratorParameterOptions, ParameterType } from './parameter';

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

export type HandlerContext = {
    request: Request,
    response: Response,
    next: Next
};

export type ParameterExtractFn = (
    context: HandlerContext,
    key?: string
) => any;

export type ParameterExtractMap = {
    [K in `${ParameterType}`]?: ParameterExtractFn
};

export type Options = {
    controllers: (ClassType | Record<string, any>)[]
    parameter?: ParameterExtractMap
};
