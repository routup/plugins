import type {
    BaseType,
    MethodDraft,
    MethodFinalizer,
    Response as ResponseDraft,
} from '@trapi/core';
import { STATUS_CODES } from 'node:http';
import type { ResponseIntent } from './types';

const BINARY_TOP_LEVEL_TYPES = new Set(['image', 'audio', 'video', 'font']);
const BINARY_APPLICATION_TYPES = new Set([
    'application/octet-stream',
    'application/pdf',
    'application/zip',
    'application/gzip',
]);

/**
 * Statuses that never carry a body: trapi documents no schema for them.
 */
const NO_CONTENT_STATUSES = new Set(['204', '205', '304']);

type MediaTypeKind = 'binary' | 'text';

/**
 * `200` and `204` use the spelling trapi gives the implicit success
 * response, so a document does not mix `Ok` and `OK`.
 */
const STATUS_DESCRIPTIONS: Record<string, string> = {
    200: 'Ok',
    204: 'No content',
};

export function describeStatus(status: string): string {
    return STATUS_DESCRIPTIONS[status] ?? STATUS_CODES[status] ?? 'Ok';
}

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

/**
 * The schema the media types of a method-level `@DProduces` stand for, when
 * all of them are of one kind.
 */
function deriveSchema(mediaTypes: string[]): BaseType | undefined {
    const kinds = new Set(mediaTypes.map((mediaType) => classifyMediaType(mediaType)));
    const [kind] = kinds;

    if (kinds.size !== 1 || !kind) {
        return undefined;
    }

    return { typeName: kind === 'binary' ? 'binary' : 'string' };
}

/**
 * Merge a response into a list: a later declaration at the same status
 * replaces the description and, when it has them, the examples and schema.
 */
export function mergeResponseIntent(
    responses: ResponseDraft[],
    intent: ResponseIntent,
): void {
    const existing = responses.find((r) => r.status === intent.status);

    if (!existing) {
        responses.push({ ...intent, name: intent.status });

        return;
    }

    existing.description = intent.description;

    if (intent.examples.length > 0) {
        existing.examples = intent.examples;
    }

    if (intent.schema) {
        existing.schema = intent.schema;
    }
}

function findResponse(draft: MethodDraft, status: string): ResponseDraft | undefined {
    return draft.responses.find((r) => r.status === status);
}

/**
 * Runs after every handler of a method, so the result does not depend on
 * the decorator order.
 */
export const finalizeMethodResponses: MethodFinalizer = (_ctx, draft) => {
    const schema = deriveSchema(draft.successProduces);
    const status = draft.successStatus ?? '200';
    const success = findResponse(draft, status);

    if (schema && !NO_CONTENT_STATUSES.has(status)) {
        if (success) {
            // A schema `@DReturns<T>` declared at the status wins.
            success.schema ??= schema;
        } else {
            draft.responses.push({
                name: status,
                status,
                description: describeStatus(status),
                examples: [],
                schema,
            });
        }

        draft.successStatus = status;

        return;
    }

    // trapi only gives a handler response the return type at an explicit
    // `successStatus`: opt in for a `@DReturns(200)` without a type.
    if (success && !success.schema) {
        draft.successStatus = status;
    }
};
