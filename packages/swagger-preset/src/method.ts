import {
    type DecoratorArgument,
    type MethodDraft,
    type MethodHandler,
    method,
} from '@trapi/metadata';

function readString(arg: DecoratorArgument | undefined): string | undefined {
    if (!arg) return undefined;
    if (arg.kind === 'literal' && typeof arg.raw === 'string') return arg.raw;
    if (arg.kind === 'identifier' && typeof arg.raw === 'string') return arg.raw;
    return undefined;
}

function setVerbAndPath(verb: MethodDraft['verb']): MethodHandler['apply'] {
    return (ctx, draft) => {
        draft.verb = verb;
        const path = readString(ctx.argument(0));
        if (path !== undefined) {
            draft.path = path;
        }
    };
}

// `@DAll` has no direct OpenAPI verb — map it to `get` (closest analogue).
const dAllHandler = method({ match: { name: 'DAll', on: 'method' }, apply: setVerbAndPath('get') });
const dDeleteHandler = method({ match: { name: 'DDelete', on: 'method' }, apply: setVerbAndPath('delete') });
const dGetHandler = method({ match: { name: 'DGet', on: 'method' }, apply: setVerbAndPath('get') });
const dHeadHandler = method({ match: { name: 'DHead', on: 'method' }, apply: setVerbAndPath('head') });
const dOptionsHandler = method({ match: { name: 'DOptions', on: 'method' }, apply: setVerbAndPath('options') });
const dPatchHandler = method({ match: { name: 'DPatch', on: 'method' }, apply: setVerbAndPath('patch') });
const dPostHandler = method({ match: { name: 'DPost', on: 'method' }, apply: setVerbAndPath('post') });
const dPutHandler = method({ match: { name: 'DPut', on: 'method' }, apply: setVerbAndPath('put') });

export function buildMethodHandlers(): MethodHandler[] {
    return [
        dAllHandler,
        dDeleteHandler,
        dGetHandler,
        dHeadHandler,
        dOptionsHandler,
        dPatchHandler,
        dPostHandler,
        dPutHandler,
    ];
}
