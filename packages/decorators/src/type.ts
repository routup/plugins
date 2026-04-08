import type { IRoutupEvent } from 'routup';
import type { DecoratorMethodOptions } from './method';
import type { DecoratorParameterOptions, ParameterType } from './parameter';

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
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
    run(event: IRoutupEvent): Promise<unknown> | unknown;
}

export type HandlerContext = {
    event: IRoutupEvent,
};

export type ParameterExtractFn = (
    context: HandlerContext,
    key?: string,
) => any;

export type ParameterExtractMap = {
    [K in `${ParameterType}`]?: ParameterExtractFn
};

export type Options = {
    controllers: (ClassType | Record<string, any>)[]
    parameter?: ParameterExtractMap
};
