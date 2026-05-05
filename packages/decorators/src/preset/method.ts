import {
    type MethodDraft,
    type MethodHandler,
    method,
    setMethodPath,
} from '@trapi/metadata';

function setVerbAndPath(verb: MethodDraft['verb']): MethodHandler['apply'] {
    return (ctx, draft) => {
        draft.verb = verb;
        setMethodPath(draft, ctx.argument(0));
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
