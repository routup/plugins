import {
    type ControllerHandler,
    type HandlerContext,
    type MethodDraft,
    type MethodHandler,
    controller,
    method,
    readString,
} from '@trapi/core';
import { addMethodProduces } from './response';

const BINARY_TOP_LEVEL_TYPES = new Set(['image', 'audio', 'video', 'font']);
const BINARY_APPLICATION_TYPES = new Set([
    'application/octet-stream',
    'application/pdf',
    'application/zip',
    'application/gzip',
]);

type MediaTypeKind = 'binary' | 'text';

/**
 * Classify a media type for the response schema:
 * `binary` → `type: string, format: binary`, `text` → `type: string`,
 * `undefined` → the method's return type is kept.
 */
export function classifyMediaType(input: string): MediaTypeKind | undefined {
    const mediaType = input.split(';')[0]!.trim().toLowerCase();

    if (mediaType.endsWith('+json') || mediaType.endsWith('+xml')) {
        return undefined;
    }

    if (BINARY_APPLICATION_TYPES.has(mediaType)) {
        return 'binary';
    }

    const topLevelType = mediaType.split('/')[0]!;

    if (BINARY_TOP_LEVEL_TYPES.has(topLevelType)) {
        return 'binary';
    }

    if (topLevelType === 'text') {
        return 'text';
    }

    return undefined;
}

function readMediaTypes(ctx: HandlerContext): string[] {
    const output: string[] = [];

    for (const argument of ctx.arguments()) {
        const value = readString(argument);

        if (value) {
            output.push(value);
        }
    }

    return output;
}

function applyMethodProduces(ctx: HandlerContext, draft: MethodDraft): void {
    const mediaTypes = readMediaTypes(ctx);
    const kinds = new Set(mediaTypes.map((mediaType) => classifyMediaType(mediaType)));
    const [kind] = kinds;

    // Without a derived schema the success response has to carry the
    // method's return type, which a handler cannot see, and trapi only
    // merges it into a handler response when `successStatus` is set.
    // Fall back to the operation-wide `produces` for those media types.
    if (kinds.size !== 1 || !kind) {
        draft.produces.push(...mediaTypes);

        return;
    }

    // Placed on the success response once the `@DStatus` code is known,
    // whatever the decorator order.
    addMethodProduces(draft, mediaTypes, { typeName: kind === 'binary' ? 'binary' : 'string' });
}

const classProducesHandler = controller({
    match: { name: 'DProduces', on: 'class' },
    apply: (ctx, draft) => {
        draft.produces.push(...readMediaTypes(ctx));
    },
});

const methodProducesHandler = method({
    match: { name: 'DProduces', on: 'method' },
    apply: applyMethodProduces,
});

export function buildProducesControllerHandlers(): ControllerHandler[] {
    return [classProducesHandler];
}

export function buildProducesMethodHandlers(): MethodHandler[] {
    return [methodProducesHandler];
}
