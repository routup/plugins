import type { DecoratorMeta, DecoratorResponseOptions } from '../types';

const symbol = Symbol.for('@routup/decorators:DecoratorMeta');

export function useDecoratorMeta(target: Record<string, any>) : DecoratorMeta {
    if (symbol in target) {
        return (target as any)[symbol];
    }

    // Maps keyed by method name have no prototype, so that a method named
    // like an `Object.prototype` member (e.g. `toString`) does not resolve
    // to the inherited value.
    (target as any)[symbol] = {
        url: '',
        middlewares: [],
        methods: Object.create(null),
        produces: [],
        responses: Object.create(null),
        parameters: Object.create(null),
    } satisfies DecoratorMeta;

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
