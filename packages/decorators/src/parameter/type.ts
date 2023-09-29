import type { Next, Request, Response } from 'routup';
import type { ParameterType } from './constants';

export type DecoratorParameterBuildFn = (
    req: Request,
    res: Response,
    next: Next,
    property?: string
) => any;

export type DecoratorParameterOptions = {
    index: number,
    type: `${ParameterType}`,
    property?: string,
};
