import type { ParameterType } from './constants';

export type DecoratorParameterOptions = {
    index: number,
    type: `${ParameterType}`,
    property?: string,
};
