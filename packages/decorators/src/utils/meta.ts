import type { DecoratorMeta, DecoratorResponseOptions } from '../types';
import { isObject } from './object';

const symbol = Symbol.for('@routup/decorators:DecoratorMeta');

/**
 * Marks a list or an entry a subclass copied from its parent. Entries keyed
 * by method name follow the declaration the route comes from: the first
 * built-in decorator of the subclass that writes such an entry replaces it
 * as a whole, and a verb decorator of the subclass drops the ones still
 * inherited. A global symbol on the copy itself, so that every copy of the
 * package sees the mark.
 */
const inheritedMark = Symbol.for('@routup/decorators:Inherited');

type DecoratorParameters = DecoratorMeta['parameters'][string];

function markInherited<T extends object>(value: T) : T {
    Object.defineProperty(value, inheritedMark, { value: true });

    return value;
}

function isInherited(value: unknown) : boolean {
    return isObject(value) || Array.isArray(value) ?
        (value as any)[inheritedMark] === true :
        false;
}

function isClassPrototype(target: Record<string, any>) : boolean {
    return Object.hasOwn(target, 'constructor') &&
        typeof target.constructor === 'function' &&
        target.constructor.prototype === target;
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
 * subclass leaves it without an entry of its own. A target with none in its
 * chain gets a new entry.
 */
export function readDecoratorMeta(target: Record<string, any>) : DecoratorMeta {
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
            { ...method, middlewares: [...(method.middlewares ?? [])] } :
            method;
    }

    const responses : DecoratorMeta['responses'] = Object.create(null);

    for (const [key, response] of Object.entries(meta.responses)) {
        responses[key] = markInherited(response?.produces ?
            { ...response, produces: [...response.produces] } :
            { ...response });
    }

    const parameters : DecoratorMeta['parameters'] = Object.create(null);

    for (const [key, entries] of Object.entries(meta.parameters)) {
        parameters[key] = markInherited((entries ?? []).map((parameter) => ({ ...parameter })));
    }

    return {
        url: Array.isArray(meta.url) ? [...meta.url] : meta.url,
        middlewares: markInherited([...meta.middlewares]),
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
 * metadata through its prototype chain. A target with none in its chain
 * gets a new entry.
 */
export function useDecoratorMeta(target: Record<string, any>) : DecoratorMeta {
    const meta = readDecoratorMeta(target);

    if (Object.hasOwn(target, symbol) || !isClassPrototype(target)) {
        return meta;
    }

    (target as any)[symbol] = copyDecoratorMeta(meta);

    return (target as any)[symbol];
}

/**
 * Set the controller path and, when given, the controller middlewares. A
 * subclass keeps the inherited middlewares when none are given.
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
    } else if (!isInherited(meta.middlewares)) {
        meta.middlewares = [];
    }
}

/**
 * Resolve the parameter list of a method that a parameter decorator adds
 * to. A list copied from the parent is replaced, so that the parameter
 * decorators of an override are not mixed with the inherited ones.
 */
export function useDecoratorParameters(
    target: Record<string, any>,
    propertyKey: string,
) : DecoratorParameters {
    const meta = useDecoratorMeta(target);
    const parameters = meta.parameters[propertyKey];

    if (!parameters || (Object.hasOwn(target, symbol) && isInherited(parameters))) {
        meta.parameters[propertyKey] = [];
    }

    return meta.parameters[propertyKey]!;
}

/**
 * Set the route of a method. A route a subclass declares replaces the
 * inherited route of that method together with its inherited parameter
 * decorators and response options: the override declares its own, if any.
 */
export function setDecoratorMethod(
    target: Record<string, any>,
    propertyKey: string,
    method: DecoratorMeta['methods'][string],
) : void {
    const meta = useDecoratorMeta(target);

    meta.methods[propertyKey] = method;

    if (!Object.hasOwn(target, symbol)) {
        return;
    }

    if (isInherited(meta.parameters[propertyKey])) {
        meta.parameters[propertyKey] = [];
    }

    if (isInherited(meta.responses[propertyKey])) {
        meta.responses[propertyKey] = {};
    }
}

/**
 * Resolve the response options of a method. On a class prototype, options
 * copied from the parent are replaced as a whole, so that `@DStatus()` and
 * `@DProduces()` of an override do not mix with the inherited ones; any
 * other target reads them through its prototype chain.
 */
export function useDecoratorResponseOptions(
    target: Record<string, any>,
    propertyKey: string,
) : DecoratorResponseOptions {
    const meta = useDecoratorMeta(target);
    const response = meta.responses[propertyKey];

    if (!response || (Object.hasOwn(target, symbol) && isInherited(response))) {
        meta.responses[propertyKey] = {};
    }

    return meta.responses[propertyKey]!;
}
