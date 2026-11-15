import {
    type BaseType,
    type MethodDraft,
    type MethodFinalizer,
    type Response as ResponseDraft,
    type Type,
    isAnyType,
    isBinaryType,
    isBufferType,
    isEnumType,
    isFileType,
    isRefAliasType,
    isRefObjectType,
    isUndefinedType,
    isUnionType,
    isVoidType,
} from '@trapi/core';
import { STATUS_CODES } from 'node:http';
import type { ResponseIntent } from './types';

/**
 * Statuses that never carry a body: trapi documents no schema for them.
 */
const NO_CONTENT_STATUSES = new Set(['204', '205', '304']);

/**
 * Web API classes a handler returns as the body. They are matched by name,
 * so an own type with one of these names is taken for the Web API class.
 */
const OPAQUE_REFERENCE_NAMES = new Set(['Response', 'Blob', 'File']);

/**
 * `application/*` subtypes whose payload is text.
 */
const TEXT_SUBTYPES = new Set([
    'javascript',
    'ecmascript',
    'yaml',
    'x-yaml',
    'x-ndjson',
    'ndjson',
    'x-www-form-urlencoded',
    'graphql',
    'sql',
]);

type MediaTypeKind = 'binary' | 'text' | 'structured' | 'unknown';

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
 * `text` → `type: string`, `binary` → `type: string, format: binary`.
 * For `structured` (JSON and XML) and `unknown` (a wildcard, `multipart/*`
 * or a malformed value) no schema can be derived.
 */
export function classifyMediaType(input: string): MediaTypeKind {
    const mediaType = input.split(';')[0]!.trim().toLowerCase();
    const [topLevelType, subType, ...rest] = mediaType.split('/');

    if (
        !topLevelType ||
        !subType ||
        rest.length > 0 ||
        mediaType.includes('*') ||
        topLevelType === 'multipart'
    ) {
        return 'unknown';
    }

    if (topLevelType === 'text') {
        return 'text';
    }

    if (
        subType === 'json' ||
        subType === 'xml' ||
        subType.endsWith('+json') ||
        subType.endsWith('+xml')
    ) {
        return 'structured';
    }

    if (TEXT_SUBTYPES.has(subType) || subType.endsWith('+yaml')) {
        return 'text';
    }

    return 'binary';
}

function isNullishType(type: Type): boolean {
    return isVoidType(type) ||
        isUndefinedType(type) ||
        (isEnumType(type) && type.members.every((member) => member === null));
}

/**
 * Whether a return type says nothing about the payload, so the media types
 * are the only hint. trapi resolves `Uint8Array`, `ArrayBuffer` and
 * `ReadableStream` to `any`.
 */
export function isOpaqueType(type: Type): boolean {
    if (
        isNullishType(type) ||
        isAnyType(type) ||
        isBufferType(type) ||
        isBinaryType(type) ||
        isFileType(type)
    ) {
        return true;
    }

    if (isRefAliasType(type)) {
        return isOpaqueType(type.type);
    }

    if (isRefObjectType(type)) {
        return OPAQUE_REFERENCE_NAMES.has(type.refName.replace(/^globalThis\./, ''));
    }

    if (isUnionType(type)) {
        // `any` swallows the other members, `null`/`undefined` add nothing.
        return type.members.some((member) => isAnyType(member)) ||
            type.members.every((member) => isOpaqueType(member));
    }

    return false;
}

/**
 * The schema the media types of a method-level `@DProduces` stand for when
 * the return type is opaque: a string or binary when all of them are of that
 * kind, otherwise an unspecified schema (which beats documenting the Fetch
 * `Response` class as the payload).
 */
function deriveSchema(mediaTypes: string[]): BaseType {
    const kinds = new Set(mediaTypes.map((mediaType) => classifyMediaType(mediaType)));
    const [kind] = kinds;

    if (kinds.size === 1 && kind === 'binary') {
        return { typeName: 'binary' };
    }

    if (kinds.size === 1 && kind === 'text') {
        return { typeName: 'string' };
    }

    return { typeName: 'any' };
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
    const produces = draft.successProduces.length > 0 && !NO_CONTENT_STATUSES.has(status);

    // A schema `@DReturns<T>` declared at the status wins, and so does a
    // return type that describes the payload.
    if (produces && !success?.schema && isOpaqueType(ctx.returnType())) {
        const schema = deriveSchema(draft.successProduces);

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

    // Opt in to the status explicitly when a response is declared at it:
    // trapi only then gives it the return type (a `@DReturns(200)` without
    // a type) and the media types (a method without a return value, whose
    // implicit status is 204).
    if (success && (!success.schema || produces)) {
        draft.successStatus = status;
    }
};
