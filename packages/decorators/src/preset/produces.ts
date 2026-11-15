import {
    type ControllerHandler,
    type MethodHandler,
    append,
    controller,
    method,
} from '@trapi/core';

// The media types of the response that carries the return type: error
// responses keep their own. A method-level list replaces the class-level one.
const appendSuccessProduces = append('successProduces').positionalAll();

const classProducesHandler = controller({
    match: { name: 'DProduces', on: 'class' },
    apply: appendSuccessProduces,
});

const methodProducesHandler = method({
    match: { name: 'DProduces', on: 'method' },
    apply: appendSuccessProduces,
});

export function buildProducesControllerHandlers(): ControllerHandler[] {
    return [classProducesHandler];
}

export function buildProducesMethodHandlers(): MethodHandler[] {
    return [methodProducesHandler];
}
