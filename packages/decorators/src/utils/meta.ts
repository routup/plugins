import type { DecoratorMeta, DecoratorResponseOptions } from '../types';
import { isObject } from './object';

const symbol = Symbol.for('@routup/decorators:DecoratorMeta');

function isClassPrototype(target: Record<string, any>) : boolean {
    return Object.hasOwn(target, 'constructor') &&
        target.constructor?.prototype === target;
}

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

/**
 * Resolve the metadata of a target through its prototype chain without
 * copying it, so that mounting or listing an instance or an undecorated
 * subclass leaves it without an entry of its own. Fills the fields an
 * older copy of the package did not write, and creates an entry on a
 * target with none in its chain.
 */
export function useResolvedDecoratorMeta(target: Record<string, any>) : DecoratorMeta {
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

/**
 * The metadata as it may be found: a custom decorator, plain JavaScript or
 * an older copy of the package may leave an entry or a field unset.
 */
type LooseEntries<T> = Record<string, Partial<T> | undefined>;

function copyDecoratorMeta(meta: DecoratorMeta) : DecoratorMeta {
    // An unset entry or field stays unset in the copy.
    const methods : LooseEntries<DecoratorMeta['methods'][string]> = Object.create(null);
    const inputMethods : LooseEntries<DecoratorMeta['methods'][string]> = meta.methods;

    for (const [key, method] of Object.entries(inputMethods)) {
        methods[key] = method?.middlewares ?
            { ...method, middlewares: [...method.middlewares] } :
            method && { ...method };
    }

    const responses : LooseEntries<DecoratorResponseOptions> = Object.create(null);
    const inputResponses : LooseEntries<DecoratorResponseOptions> = meta.responses;

    for (const [key, response] of Object.entries(inputResponses)) {
        responses[key] = response?.produces ?
            { ...response, produces: [...response.produces] } :
            response && { ...response };
    }

    const parameters : Record<string, DecoratorMeta['parameters'][string] | undefined> = Object.create(null);
    const inputParameters : Record<string, DecoratorMeta['parameters'][string] | undefined> = meta.parameters;

    for (const [key, entries] of Object.entries(inputParameters)) {
        parameters[key] = entries?.map((parameter) => ({ ...parameter }));
    }

    // Fields this copy of the package does not know (written by a custom
    // decorator or a newer copy) are carried over as they are.
    return {
        ...meta,
        url: Array.isArray(meta.url) ? [...meta.url] : meta.url,
        middlewares: [...meta.middlewares],
        methods: methods as DecoratorMeta['methods'],
        produces: [...meta.produces],
        responses: responses as DecoratorMeta['responses'],
        parameters: parameters as DecoratorMeta['parameters'],
    };
}

/**
 * Resolve the metadata of a target. A class prototype that inherits the
 * metadata of a decorated parent first gets its own copy, on its first use
 * (also by a plain read), so that what is written to it never changes the
 * parent or a sibling. Any other target, such as an instance, reads the
 * metadata through its prototype chain, as does a prototype that cannot
 * take a property. A target with none in its chain gets a new entry.
 */
export function useDecoratorMeta(target: Record<string, any>) : DecoratorMeta {
    const meta = useResolvedDecoratorMeta(target);

    if (
        Object.hasOwn(target, symbol) ||
        !isClassPrototype(target) ||
        !Object.isExtensible(target)
    ) {
        return meta;
    }

    (target as any)[symbol] = copyDecoratorMeta(meta);

    return (target as any)[symbol];
}

/**
 * Set the controller path and middlewares. Without middlewares, the class
 * starts from the class middlewares of its parent (none without one).
 */
export function setDecoratorController(
    target: Record<string, any>,
    url: string | string[],
    middlewares?: DecoratorMeta['middlewares'],
) : void {
    const meta = useDecoratorMeta(target);

    meta.url = url;

    if (Array.isArray(middlewares)) {
        meta.middlewares = [...middlewares];

        return;
    }

    // Read without copying or creating an entry on the parent.
    const parent = Object.getPrototypeOf(target);
    const inherited : Partial<DecoratorMeta> | undefined = parent && symbol in parent ?
        parent[symbol] :
        undefined;

    meta.middlewares = [...(inherited?.middlewares ?? [])];
}

export function useDecoratorResponseOptions(
    target: Record<string, any>,
    propertyKey: string,
) : DecoratorResponseOptions {
    const meta = useDecoratorMeta(target);

    meta.responses[propertyKey] ??= {};

    return meta.responses[propertyKey];
}
