import type { DecoratorMeta, DecoratorResponseOptions } from '../types';
import { isObject } from './object';

const symbol = Symbol.for('@routup/decorators:DecoratorMeta');

/**
 * Check whether a controller instance (or its class) carries decorator
 * metadata, without creating an entry as useDecoratorMeta() does.
 */
export function hasDecoratorMeta(target: Record<string, any>) : boolean {
    if (typeof target === 'function') {
        // Arrow, bound and method shorthand functions have no prototype.
        return isObject(target.prototype) && symbol in target.prototype;
    }

    return symbol in target;
}

export function useDecoratorMeta(target: Record<string, any>) : DecoratorMeta {
    if (symbol in target) {
        const meta = (target as any)[symbol] as Partial<DecoratorMeta>;

        // The symbol is global: an older copy of the package may have
        // created the object without the fields added since.
        meta.url ??= '';
        meta.middlewares ??= [];
        meta.methods ??= Object.create(null);
        meta.produces ??= [];
        meta.responses ??= Object.create(null);
        meta.parameters ??= Object.create(null);

        return meta as DecoratorMeta;
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
