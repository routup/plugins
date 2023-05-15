import type { Next, Request, Response } from 'routup';

export type DecoratorParameterBuildFn = (
    req: Request,
    res: Response,
    next: Next,
    property?: string
) => any;

export type DecoratorParameterOptions = {
    index: number,
    build: DecoratorParameterBuildFn,
    property?: string,
};
