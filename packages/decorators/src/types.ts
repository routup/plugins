import type { IAppEvent } from 'routup';
import type { DecoratorMethodOptions } from './method';
import type { DecoratorParameterOptions } from './parameter';

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type, @typescript-eslint/naming-convention -- public API name
export interface ClassType extends Function {
    new(...args: any[]): any;
}

export type DecoratorResponseOptions = {
    /**
     * Status set by `@DStatus()`.
     */
    status?: number,

    /**
     * Media types declared with a method-level `@DProduces()`.
     */
    produces?: string[],
};

export type DecoratorMeta = {
    url: string | string[],

    methods: {
        [key: string]: DecoratorMethodOptions
    },

    middlewares: ClassType[],

    /**
     * Media types declared with a class-level `@DProduces()`.
     */
    produces: string[],

    /**
     * Response options (`@DStatus()`, method-level `@DProduces()`) per
     * method. Kept apart from `methods`, since these decorators may be
     * applied before the verb decorator.
     */
    responses: {
        [key: string]: DecoratorResponseOptions
    },

    parameters: {
        [key: string]: DecoratorParameterOptions[]
    }
};

// eslint-disable-next-line @typescript-eslint/naming-convention -- public API name
export interface HandlerInterface {
    run(event: IAppEvent): Promise<unknown> | unknown;
}

export type HandlerContext = {
    event: IAppEvent,
};

export type Options = {
    controllers: (ClassType | Record<string, any>)[]
};
