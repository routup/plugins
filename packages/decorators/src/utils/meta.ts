import type { DecoratorMeta, DecoratorResponseOptions } from '../types';
import { isObject } from './object';

const symbol = Symbol.for('@routup/decorators:DecoratorMeta');

type DecoratorParameters = DecoratorMeta['parameters'][string];

/**
 * Parameter lists and response options a subclass copied from its parent.
 * Entries keyed by method name follow the declaration the route comes from:
 * the first decorator of the subclass that writes such an entry replaces it
 * as a whole, and a verb decorator of the subclass drops the ones still
 * inherited.
 */
const inheritedEntries = new WeakSet<DecoratorParameters | DecoratorResponseOptions>();

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
 * Resolve the metadata of a target through its prototype chain, so that an
 * instance or an undecorated subclass reads the metadata of its class
 * without getting an entry of its own. A target with none in its chain gets
 * a new entry.
 */
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
        const copy : DecoratorResponseOptions = response?.produces ?
            { ...response, produces: [...response.produces] } :
            { ...response };

        inheritedEntries.add(copy);
        responses[key] = copy;
    }

    const parameters : DecoratorMeta['parameters'] = Object.create(null);

    for (const [key, entries] of Object.entries(meta.parameters)) {
        const copy = (entries ?? []).map((parameter) => ({ ...parameter }));

        inheritedEntries.add(copy);
        parameters[key] = copy;
    }

    return {
        url: Array.isArray(meta.url) ? [...meta.url] : meta.url,
        middlewares: [...meta.middlewares],
        methods,
        produces: [...meta.produces],
        responses,
        parameters,
    };
}

/**
 * Resolve the metadata a decorator writes to. A subclass prototype that
 * inherits the metadata of a decorated parent first gets its own copy, so
 * that its decorators never change the parent or a sibling. The copy is
 * taken once, when the first decorator runs on the subclass.
 */
export function useOwnDecoratorMeta(target: Record<string, any>) : DecoratorMeta {
    const meta = useDecoratorMeta(target);

    if (Object.hasOwn(target, symbol)) {
        return meta;
    }

    (target as any)[symbol] = copyDecoratorMeta(meta);

    return (target as any)[symbol];
}

/**
 * Resolve the parameter list of a method that a parameter decorator adds
 * to. A list copied from the parent is replaced, so that the parameter
 * decorators of an override are not mixed with the inherited ones.
 */
export function useOwnDecoratorParameters(
    target: Record<string, any>,
    propertyKey: string,
) : DecoratorParameters {
    const meta = useOwnDecoratorMeta(target);
    const parameters = meta.parameters[propertyKey];

    if (!parameters || inheritedEntries.has(parameters)) {
        meta.parameters[propertyKey] = [];
    }

    return meta.parameters[propertyKey]!;
}

/**
 * Set the route of a method. A route a subclass declares replaces the
 * inherited route of that method together with its inherited parameter
 * decorators and response options: the override declares its own, if any.
 */
export function setOwnDecoratorMethod(
    target: Record<string, any>,
    propertyKey: string,
    method: DecoratorMeta['methods'][string],
) : void {
    const meta = useOwnDecoratorMeta(target);
    const parameters = meta.parameters[propertyKey];
    const response = meta.responses[propertyKey];

    meta.methods[propertyKey] = method;

    if (parameters && inheritedEntries.has(parameters)) {
        meta.parameters[propertyKey] = [];
    }

    if (response && inheritedEntries.has(response)) {
        meta.responses[propertyKey] = {};
    }
}

export function useDecoratorResponseOptions(
    target: Record<string, any>,
    propertyKey: string,
) : DecoratorResponseOptions {
    const meta = useOwnDecoratorMeta(target);
    const response = meta.responses[propertyKey];

    if (!response || inheritedEntries.has(response)) {
        meta.responses[propertyKey] = {};
    }

    return meta.responses[propertyKey]!;
}
