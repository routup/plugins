import { useDecoratorMeta, useDecoratorResponseOptions } from '../utils';

export function DDeprecated() : any {
    return () => {};
}
export function DDescription<T>(name: string | number, description?: string, example?: T): any {
    return () => { };
}

export function DHidden() {
    return () => {};
}

export function DExample<T>(example: any) {
    return (...args: any) => {};
}

export function DSecurity(roles?: string | string[], name?: string) {
    return (...args: any) => { };
}

export function DTags(...names: string[]) {
    return (...args: any) => { };
}

/**
 * Declare the media types a request body may have (OpenAPI only).
 */
export function DConsumes(...mediaTypes: string[]) {
    return (...args: any) => { };
}

/**
 * Declare the media types a method (or every method of a class) answers with.
 *
 * At runtime the first media type becomes the `content-type` of a returned
 * plain value, unless a header is already set or the method sets its own.
 * A returned `Response` is left untouched. A method-level declaration
 * replaces a class-level one.
 *
 * @param mediaTypes - e.g. `'text/event-stream'` or `'application/octet-stream'`.
 */
export function DProduces(...mediaTypes: string[]) {
    return (
        target: any,
        propertyKey?: string | symbol,
    ) : void => {
        if (typeof propertyKey === 'undefined') {
            const meta = useDecoratorMeta(target.prototype);

            meta.produces = [...mediaTypes, ...meta.produces];

            return;
        }

        /* istanbul ignore next */
        if (typeof propertyKey !== 'string') {
            return;
        }

        const options = useDecoratorResponseOptions(target, propertyKey);

        options.produces = [...mediaTypes, ...(options.produces ?? [])];
    };
}
