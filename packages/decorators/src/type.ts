import type { IAppEvent } from 'routup';
import type { DecoratorMethodOptions } from './method';
import type { DecoratorParameterOptions } from './parameter';

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
export interface ClassType extends Function {
    new(...args: any[]): any;
}

export type DecoratorMeta = {
    url: string | string[],

    methods: {
        [key: string]: DecoratorMethodOptions
    },

    middlewares: ClassType[],

    parameters: {
        [key: string]: DecoratorParameterOptions[]
    }
};

export interface HandlerInterface {
    run(event: IAppEvent): Promise<unknown> | unknown;
}

export type HandlerContext = {
    event: IAppEvent,
};

export type Options = {
    controllers: (ClassType | Record<string, any>)[]
};
