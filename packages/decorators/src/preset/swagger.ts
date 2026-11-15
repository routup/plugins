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
import { STATUS_CODES } from 'node:http';
import { moveProducedResponse } from './produces';

const appendTags = append('tags').positionalAll();
const appendConsumes = append('consumes').positionalAll();

function applyDescription(ctx: HandlerContext, draft: ControllerDraft | MethodDraft): void {
    const statusArg = ctx.argument(0);
    const status = readString(statusArg) ?? String(readNumber(statusArg) ?? '200');
    const description = readString(ctx.argument(1)) ?? STATUS_CODES[status] ?? 'Ok';
    const payload = ctx.argument(2);
    const examples = payload && payload.kind !== 'unresolvable' ?
        [{ value: payload.raw }] :
        [];
    const typeArg = ctx.typeArgument(0);
    const schema = typeArg ? typeArg.resolve() : undefined;

    // A response at this status may already exist, e.g. one `@DProduces`
    // created for a binary media type: describe it instead of shadowing it.
    const existing = draft.responses.find((r) => r.status === status);

    if (existing) {
        existing.description = description;

        if (examples.length > 0) {
            existing.examples = examples;
        }

        if (schema) {
            existing.schema = schema;
        }

        return;
    }

    draft.responses.push({
        name: status,
        status,
        description,
        examples,
        schema,
    });
}

function applySecurity(ctx: HandlerContext, draft: ControllerDraft | MethodDraft): void {
    const scopesArg = ctx.argument(0);
    const nameArg = ctx.argument(1);
    const name = readString(nameArg) ?? 'default';
    const scopes: string[] = [];

    if (scopesArg?.kind === 'array' && Array.isArray(scopesArg.raw)) {
        for (const item of scopesArg.raw) {
            if (typeof item === 'string') {
                scopes.push(item);
            }
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
    apply: (_ctx, draft) => {
        draft.deprecated = true; 
    },
    marker: MarkerName.Deprecated,
});

const classDescriptionHandler = controller({
    match: { name: 'DDescription', on: 'class' },
    apply: (ctx, draft) => applyDescription(ctx, draft),
});

const classHiddenHandler = controller({
    match: { name: 'DHidden', on: 'class' },
    apply: (_ctx, draft) => {
        draft.hidden = true; 
    },
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
    apply: (_ctx, draft) => {
        draft.deprecated = true; 
    },
    marker: MarkerName.Deprecated,
});

const methodDescriptionHandler = method({
    match: { name: 'DDescription', on: 'method' },
    apply: (ctx, draft) => applyDescription(ctx, draft),
});

const methodReturnsHandler = method({
    match: { name: 'DReturns', on: 'method' },
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
    apply: (_ctx, draft) => {
        draft.hidden = true; 
    },
    marker: MarkerName.Hidden,
});

const methodSecurityHandler = method({
    match: { name: 'DSecurity', on: 'method' },
    apply: (ctx, draft) => applySecurity(ctx, draft),
});

// The argument must be a numeric literal: trapi cannot fold an imported
// constant, and an unresolved argument becomes `'undefined'`, which trapi
// rejects as an invalid success status instead of silently documenting 200.
const methodStatusHandler = method({
    match: { name: 'DStatus', on: 'method' },
    apply: (ctx, draft) => {
        draft.successStatus = String(readNumber(ctx.argument(0)));

        moveProducedResponse(draft, draft.successStatus);
    },
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
        methodReturnsHandler,
        methodSecurityHandler,
        methodStatusHandler,
        methodTagsHandler,
    ];
}
