import type { DecoratorMeta, DecoratorResponseOptions } from '../types';
import { isObject } from './object';

const symbol = Symbol.for('@routup/decorators:DecoratorMeta');

/**
 * Marks the class middlewares a subclass copied from its parent, so that
 * `@DController()` without middlewares keeps them on a subclass but resets
 * an own list. A global symbol on the array, so that every copy of the
 * package sees it.
 */
const inheritedMark = Symbol.for('@routup/decorators:Inherited');

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

function copyDecoratorMeta(meta: DecoratorMeta) : DecoratorMeta {
    const methods : DecoratorMeta['methods'] = Object.create(null);

    for (const [key, method] of Object.entries(meta.methods)) {
        // An unset entry stays unset, the mount skips it.
        methods[key] = method ?
            { ...method, middlewares: [...method.middlewares] } :
            method;
    }

    const responses : DecoratorMeta['responses'] = Object.create(null);

    for (const [key, response] of Object.entries(meta.responses)) {
        const copy = { ...response };

        if (copy.produces) {
            copy.produces = [...copy.produces];
        }

        responses[key] = copy;
    }

    const parameters : DecoratorMeta['parameters'] = Object.create(null);

    for (const [key, entries] of Object.entries(meta.parameters)) {
        parameters[key] = entries.map((parameter) => ({ ...parameter }));
    }

    const middlewares = [...meta.middlewares];

    Object.defineProperty(middlewares, inheritedMark, { value: true });

    // Fields this copy of the package does not know (written by a custom
    // decorator or a newer copy) are carried over as they are.
    return {
        ...meta,
        url: Array.isArray(meta.url) ? [...meta.url] : meta.url,
        middlewares,
        methods,
        produces: [...meta.produces],
        responses,
        parameters,
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
 * Set the controller path and middlewares. Without middlewares, a subclass
 * keeps the ones it copied from its parent, while an own list is reset.
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
    } else if ((meta.middlewares as any)[inheritedMark] !== true) {
        meta.middlewares = [];
    }
}

export function useDecoratorResponseOptions(
    target: Record<string, any>,
    propertyKey: string,
) : DecoratorResponseOptions {
    const meta = useDecoratorMeta(target);

    meta.responses[propertyKey] ??= {};

    return meta.responses[propertyKey];
}
