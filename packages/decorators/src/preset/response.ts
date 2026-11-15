import type {
    BaseType,
    MethodDraft,
    Response as ResponseDraft,
} from '@trapi/core';
import { STATUS_CODES } from 'node:http';
import type { ResponseIntent } from './types';

type ProducedIntent = {
    mediaTypes: string[],
    schema: BaseType,
};

/**
 * What `@DStatus`, `@DProduces` and `@DReturns`/`@DDescription` declared on
 * a method. trapi applies the handlers in decorator order and offers no step
 * after the last one, so each handler records its intent here and calls
 * `resolveMethodResponses()`, which recomputes the responses from the whole
 * intent: the result does not depend on the decorator order.
 */
type MethodResponseState = {
    successStatus?: string,
    responses: ResponseIntent[],
    produced: ProducedIntent[],
    /**
     * Responses the last resolution placed on the draft.
     */
    placed: ResponseDraft[],
};

const states = new WeakMap<MethodDraft, MethodResponseState>();

export function describeStatus(status: string): string {
    return STATUS_CODES[status] ?? 'Ok';
}

function useState(draft: MethodDraft): MethodResponseState {
    let state = states.get(draft);

    if (!state) {
        state = {
            responses: [],
            produced: [],
            placed: [],
        };

        states.set(draft, state);
    }

    return state;
}

/**
 * Merge a response into a list: a later declaration at the same status
 * replaces the description and, when it has them, the examples and schema.
 */
export function mergeResponseIntent<T extends ResponseIntent>(
    responses: T[],
    intent: T,
): void {
    const existing = responses.find((r) => r.status === intent.status);

    if (!existing) {
        responses.push(intent);

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

function resolveMethodResponses(draft: MethodDraft): void {
    const state = useState(draft);

    for (const response of state.placed) {
        const index = draft.responses.indexOf(response);

        if (index !== -1) {
            draft.responses.splice(index, 1);
        }
    }

    const responses: ResponseDraft[] = state.responses.map((intent) => ({
        name: intent.status,
        status: intent.status,
        description: intent.description,
        examples: [...intent.examples],
        ...(intent.schema ? { schema: intent.schema } : {}),
    }));

    const successStatus = state.successStatus ?? '200';
    let success = responses.find((r) => r.status === successStatus);

    // Created for `@DStatus` too, to describe it by its reason phrase:
    // trapi gives a response at an explicit `successStatus` the return
    // type when it has no schema.
    if (!success && (state.successStatus !== undefined || state.produced.length > 0)) {
        success = {
            name: successStatus,
            status: successStatus,
            description: describeStatus(successStatus),
            examples: [],
        };

        responses.push(success);
    }

    if (success && state.produced.length > 0) {
        // A schema `@DReturns<T>` declared at the status wins.
        success.schema ??= state.produced[0]!.schema;
        success.produces = state.produced.flatMap((p) => p.mediaTypes);
    }

    // trapi only gives a handler response the return type at an explicit
    // `successStatus`: opt in for a `@DReturns(200)` without a type.
    if (state.successStatus === undefined && success && !success.schema) {
        draft.successStatus = '200';
    } else {
        draft.successStatus = state.successStatus;
    }

    draft.responses.push(...responses);
    state.placed = responses;
}

export function setMethodSuccessStatus(draft: MethodDraft, status: string): void {
    useState(draft).successStatus = status;

    resolveMethodResponses(draft);
}

export function addMethodResponse(draft: MethodDraft, intent: ResponseIntent): void {
    mergeResponseIntent(useState(draft).responses, intent);

    resolveMethodResponses(draft);
}

export function addMethodProduces(draft: MethodDraft, mediaTypes: string[], schema: BaseType): void {
    useState(draft).produced.push({ mediaTypes, schema });

    resolveMethodResponses(draft);
}
