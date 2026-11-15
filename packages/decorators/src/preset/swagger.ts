import {
    type ControllerDraft,
    type ControllerHandler,
    type DecoratorArgument,
    type HandlerContext,
    MarkerName,
    type MethodDraft,
    type MethodHandler,
    append,
    controller,
    method,
    readNumber,
    readString,
    requireArgument,
    requireNumber,
} from '@trapi/core';
import type { ResponseIntent } from './types';
import { describeStatus, mergeResponseIntent } from './response';

const appendTags = append('tags').positionalAll();
const appendConsumes = append('consumes').positionalAll();

// A status code, a range (`4XX`) or `default`: the keys OpenAPI allows.
const STATUS_PATTERN = /^([1-5]\d\d|[1-5]XX|default)$/;

function readStatus(argument: DecoratorArgument): string | undefined {
    const value = readString(argument) ?? readNumber(argument);

    if (value === undefined) {
        return undefined;
    }

    const status = String(value);

    return STATUS_PATTERN.test(status) ? status : undefined;
}

/**
 * Read the response a `@DReturns`/`@DDescription` declares. A status that
 * cannot be resolved fails generation: documenting such a response at 200
 * would overwrite the success response.
 */
function readResponseIntent(ctx: HandlerContext): ResponseIntent {
    const status = requireArgument(ctx, 0, readStatus, 'a status code (e.g. 409, a range such as \'4XX\', or \'default\')') ?? '200';
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

function applyDescription(ctx: HandlerContext, draft: ControllerDraft | MethodDraft): void {
    mergeResponseIntent(draft.responses, readResponseIntent(ctx));
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
    apply: applyDescription,
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
    apply: applyDescription,
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
    apply: applyDescription,
});

const methodReturnsHandler = method({
    match: { name: 'DReturns', on: 'method' },
    apply: applyDescription,
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

// A code that cannot be resolved (e.g. a call expression) fails generation
// instead of silently documenting 200.
const methodStatusHandler = method({
    match: { name: 'DStatus', on: 'method' },
    apply: (ctx, draft) => {
        const status = requireNumber(ctx, 0);

        if (status !== undefined) {
            draft.successStatus = String(status);
        }
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
