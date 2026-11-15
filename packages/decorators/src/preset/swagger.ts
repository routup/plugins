import {
    type ControllerDraft,
    type ControllerHandler,
    type HandlerContext,
    MarkerName,
    type MethodDraft,
    type MethodHandler,
    type Response as ResponseDraft,
    append,
    controller,
    method,
    readNumber,
    readString,
} from '@trapi/core';
import type { ResponseIntent } from './types';
import {
    addMethodResponse,
    describeStatus,
    mergeResponseIntent,
    setMethodSuccessStatus,
} from './response';

const appendTags = append('tags').positionalAll();
const appendConsumes = append('consumes').positionalAll();

/**
 * Read the response a `@DReturns`/`@DDescription` declares.
 */
function readResponseIntent(ctx: HandlerContext, _decorator: string): ResponseIntent {
    const statusArg = ctx.argument(0);

    let status: string | undefined;

    if (statusArg) {
        status = readString(statusArg);

        if (status === undefined) {
            const value = readNumber(statusArg);

            if (value !== undefined) {
                status = String(value);
            }
        }
    }

    status ??= '200';

    const description = readString(ctx.argument(1)) ?? describeStatus(status);
    const payload = ctx.argument(2);
    const examples = payload && payload.kind !== 'unresolvable' ?
        [{ value: payload.raw }] :
        [];
    const typeArg = ctx.typeArgument(0);
    const schema = typeArg ? typeArg.resolve() : undefined;

    return {
        status,
        description,
        examples,
        ...(schema ? { schema } : {}),
    };
}

function applyClassDescription(ctx: HandlerContext, draft: ControllerDraft, decorator: string): void {
    const intent = readResponseIntent(ctx, decorator);

    mergeResponseIntent(draft.responses as (ResponseDraft & ResponseIntent)[], { ...intent, name: intent.status });
}

function applyMethodDescription(ctx: HandlerContext, draft: MethodDraft, decorator: string): void {
    addMethodResponse(draft, readResponseIntent(ctx, decorator));
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
    apply: (ctx, draft) => applyClassDescription(ctx, draft, 'DDescription'),
});

const classHiddenHandler = controller({
    match: { name: 'DHidden', on: 'class' },
    apply: (_ctx, draft) => {
        draft.hidden = true; 
    },
    marker: MarkerName.Hidden,
});

const classReturnsHandler = controller({
    match: { name: 'DReturns', on: 'class' },
    apply: (ctx, draft) => applyClassDescription(ctx, draft, 'DReturns'),
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
    apply: (ctx, draft) => applyMethodDescription(ctx, draft, 'DDescription'),
});

const methodReturnsHandler = method({
    match: { name: 'DReturns', on: 'method' },
    apply: (ctx, draft) => applyMethodDescription(ctx, draft, 'DReturns'),
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
        setMethodSuccessStatus(draft, String(readNumber(ctx.argument(0))));
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
        classReturnsHandler,
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
