import type {
    BaseType,
    MethodDraft,
    MethodFinalizer,
    Response as ResponseDraft,
    Type,
} from '@trapi/core';
import { STATUS_CODES } from 'node:http';
import type { ResponseIntent } from './types';

/**
 * Statuses that never carry a body: trapi documents no schema for them.
 */
const NO_CONTENT_STATUSES = new Set(['204', '205', '304']);

/**
 * Return types that say nothing about the payload: trapi resolves
 * `Uint8Array`, `ArrayBuffer` and `ReadableStream` to `any`.
 */
const OPAQUE_TYPE_NAMES = new Set(['any', 'buffer', 'binary', 'file', 'void', 'undefined']);
const OPAQUE_REFERENCE_NAMES = new Set(['Response', 'Blob', 'File', 'ReadableStream']);

type MediaTypeKind = 'binary' | 'text' | 'structured';

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
 * Classify a media type for the schema of a payload whose type is unknown:
 * `text` → `type: string`, `structured` (JSON and XML) → no schema can be
 * derived, anything else is `binary` → `type: string, format: binary`.
 */
export function classifyMediaType(input: string): MediaTypeKind {
    const mediaType = input.split(';')[0]!.trim().toLowerCase();
    const [topLevelType, subType = ''] = mediaType.split('/');

    if (
        subType === 'json' ||
        subType === 'xml' ||
        subType.endsWith('+json') ||
        subType.endsWith('+xml')
    ) {
        return 'structured';
    }

    return topLevelType === 'text' ? 'text' : 'binary';
}

/**
 * Whether a return type says nothing about the payload, so the media types
 * are the only hint.
 */
export function isOpaqueType(type: Type): boolean {
    if (type.typeName === 'union') {
        return type.members.every((member) => isOpaqueType(member));
    }

    if (type.typeName === 'refObject') {
        return OPAQUE_REFERENCE_NAMES.has(type.refName);
    }

    return OPAQUE_TYPE_NAMES.has(type.typeName);
}

/**
 * The schema the media types of a method-level `@DProduces` stand for, when
 * all of them are of one kind.
 */
function deriveSchema(mediaTypes: string[]): BaseType | undefined {
    const kinds = new Set(mediaTypes.map((mediaType) => classifyMediaType(mediaType)));
    const [kind] = kinds;

    if (kinds.size !== 1 || !kind || kind === 'structured') {
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
export const finalizeMethodResponses: MethodFinalizer = (ctx, draft) => {
    const status = draft.successStatus ?? '200';
    const success = findResponse(draft, status);

    // A schema `@DReturns<T>` declared at the status wins, and so does a
    // return type that describes the payload.
    if (
        draft.successProduces.length > 0 &&
        !success?.schema &&
        !NO_CONTENT_STATUSES.has(status)
    ) {
        const schema = deriveSchema(draft.successProduces);

        if (schema && isOpaqueType(ctx.returnType())) {
            if (success) {
                success.schema = schema;
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
    }

    // trapi only gives a handler response the return type at an explicit
    // `successStatus`: opt in for a `@DReturns(200)` without a type.
    if (success && !success.schema) {
        draft.successStatus = status;
    }
};
