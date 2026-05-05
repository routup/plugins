import {
    type ControllerDraft,
    type ControllerHandler,
    type HandlerContext,
    MarkerName,
    type MethodDraft,
    type MethodHandler,
    append,
    controller,
    method,
    readNumber,
    readString,
} from '@trapi/core';

const appendTags = append('tags').positionalAll();
const appendConsumes = append('consumes').positionalAll();

function applyDescription(ctx: HandlerContext, draft: ControllerDraft | MethodDraft): void {
    const statusArg = ctx.argument(0);
    const status = readString(statusArg) ?? String(readNumber(statusArg) ?? '200');
    const description = readString(ctx.argument(1)) ?? 'Ok';
    const payload = ctx.argument(2);
    const examples = payload && payload.kind !== 'unresolvable' ?
        [{ value: payload.raw }] :
        [];
    const typeArg = ctx.typeArgument(0);
    draft.responses.push({
        name: status,
        status,
        description,
        examples,
        schema: typeArg ? typeArg.resolve() : undefined,
    });
}

function applySecurity(ctx: HandlerContext, draft: ControllerDraft | MethodDraft): void {
    const scopesArg = ctx.argument(0);
    const nameArg = ctx.argument(1);
    const name = readString(nameArg) ?? 'default';
    const scopes: string[] = [];
    if (scopesArg?.kind === 'array' && Array.isArray(scopesArg.raw)) {
        for (const item of scopesArg.raw) {
            if (typeof item === 'string') scopes.push(item);
        }
    } else if (scopesArg?.kind === 'literal' && typeof scopesArg.raw === 'string') {
        scopes.push(scopesArg.raw);
    }
    draft.security ??= [];
    draft.security.push({ [name]: scopes });
}

// -----------------------------------------------------------------------------
// Class-level swagger handlers
// -----------------------------------------------------------------------------

const classConsumesHandler = controller({
    match: { name: 'DConsumes', on: 'class' },
    apply: appendConsumes,
});

const classDeprecatedHandler = controller({
    match: { name: 'DDeprecated', on: 'class' },
    apply: (_ctx, draft) => { draft.deprecated = true; },
    marker: MarkerName.Deprecated,
});

const classDescriptionHandler = controller({
    match: { name: 'DDescription', on: 'class' },
    apply: (ctx, draft) => applyDescription(ctx, draft),
});

const classHiddenHandler = controller({
    match: { name: 'DHidden', on: 'class' },
    apply: (_ctx, draft) => { draft.hidden = true; },
    marker: MarkerName.Hidden,
});

const classSecurityHandler = controller({
    match: { name: 'DSecurity', on: 'class' },
    apply: (ctx, draft) => applySecurity(ctx, draft),
});

const classTagsHandler = controller({
    match: { name: 'DTags', on: 'class' },
    apply: appendTags,
});

// -----------------------------------------------------------------------------
// Method-level swagger handlers
// -----------------------------------------------------------------------------

const methodConsumesHandler = method({
    match: { name: 'DConsumes', on: 'method' },
    apply: appendConsumes,
});

const methodDeprecatedHandler = method({
    match: { name: 'DDeprecated', on: 'method' },
    apply: (_ctx, draft) => { draft.deprecated = true; },
    marker: MarkerName.Deprecated,
});

const methodDescriptionHandler = method({
    match: { name: 'DDescription', on: 'method' },
    apply: (ctx, draft) => applyDescription(ctx, draft),
});

const methodExampleHandler = method({
    match: { name: 'DExample', on: 'method' },
    apply: (ctx, draft) => {
        const payload = ctx.argument(0);
        if (!payload || payload.kind === 'unresolvable') {
            return;
        }
        draft.defaultResponseExamples.push({ value: payload.raw });
    },
});

const methodHiddenHandler = method({
    match: { name: 'DHidden', on: 'method' },
    apply: (_ctx, draft) => { draft.hidden = true; },
    marker: MarkerName.Hidden,
});

const methodSecurityHandler = method({
    match: { name: 'DSecurity', on: 'method' },
    apply: (ctx, draft) => applySecurity(ctx, draft),
});

const methodTagsHandler = method({
    match: { name: 'DTags', on: 'method' },
    apply: appendTags,
});

export function buildSwaggerControllerHandlers(): ControllerHandler[] {
    return [
        classConsumesHandler,
        classDeprecatedHandler,
        classDescriptionHandler,
        classHiddenHandler,
        classSecurityHandler,
        classTagsHandler,
    ];
}

export function buildSwaggerMethodHandlers(): MethodHandler[] {
    return [
        methodConsumesHandler,
        methodDeprecatedHandler,
        methodDescriptionHandler,
        methodExampleHandler,
        methodHiddenHandler,
        methodSecurityHandler,
        methodTagsHandler,
    ];
}
