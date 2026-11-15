import {
    type ControllerDraft,
    type ControllerHandler,
    type HandlerContext,
    type MethodDraft,
    type MethodHandler,
    controller,
    method,
    requireString,
} from '@trapi/core';

/**
 * The media types of the response that carries the return type: error
 * responses keep their own. A method-level list replaces the class-level
 * one. A media type that cannot be resolved fails generation.
 */
function applyProduces(ctx: HandlerContext, draft: ControllerDraft | MethodDraft): void {
    const { length } = ctx.arguments();

    for (let i = 0; i < length; i++) {
        const mediaType = requireString(ctx, i)?.trim();

        if (mediaType) {
            draft.successProduces.push(mediaType);
        }
    }
}

const classProducesHandler = controller({
    match: { name: 'DProduces', on: 'class' },
    apply: applyProduces,
});

const methodProducesHandler = method({
    match: { name: 'DProduces', on: 'method' },
    apply: applyProduces,
});

export function buildProducesControllerHandlers(): ControllerHandler[] {
    return [classProducesHandler];
}

export function buildProducesMethodHandlers(): MethodHandler[] {
    return [methodProducesHandler];
}
