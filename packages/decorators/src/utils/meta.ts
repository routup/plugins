import type { DecoratorMeta, DecoratorResponseOptions } from '../types';

const symbol = Symbol.for('@routup/decorators:DecoratorMeta');

export function useDecoratorMeta(target: Record<string, any>) : DecoratorMeta {
    if (symbol in target) {
        return (target as any)[symbol];
    }

    (target as any)[symbol] = {
        url: '',
        middlewares: [],
        methods: {},
        produces: [],
        responses: {},
        parameters: {},
    } as DecoratorMeta;

    return (target as any)[symbol];
}

export function useDecoratorResponseOptions(
    target: Record<string, any>,
    propertyKey: string,
) : DecoratorResponseOptions {
    const meta = useDecoratorMeta(target);

    meta.responses[propertyKey] ??= {};

    return meta.responses[propertyKey];
}
