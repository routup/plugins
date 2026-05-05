import {
    ParamKind,
    type ParameterHandler,
    parameter,
    readString,
} from '@trapi/core';

const dContextHandler = parameter({
    match: { name: 'DContext', on: 'parameter' },
    apply: (_ctx, draft) => { draft.in = ParamKind.Context; },
});

const dRequestHandler = parameter({
    match: { name: 'DRequest', on: 'parameter' },
    apply: (_ctx, draft) => { draft.in = ParamKind.Context; },
});

const dResponseHandler = parameter({
    match: { name: 'DResponse', on: 'parameter' },
    apply: (_ctx, draft) => { draft.in = ParamKind.Context; },
});

const dNextHandler = parameter({
    match: { name: 'DNext', on: 'parameter' },
    apply: (_ctx, draft) => { draft.in = ParamKind.Context; },
});

// `@DQuery()` (no arg) binds the entire query object → `Query`.
// `@DQuery('foo')` binds a single property → `QueryProp`.
const dQueryHandler = parameter({
    match: { name: 'DQuery', on: 'parameter' },
    apply: (ctx, draft) => {
        const name = readString(ctx.argument(0));
        if (name !== undefined) {
            draft.in = ParamKind.QueryProp;
            draft.name = name;
        } else {
            draft.in = ParamKind.Query;
        }
    },
});

// `@DBody()` → entire body; `@DBody('foo')` → single property.
const dBodyHandler = parameter({
    match: { name: 'DBody', on: 'parameter' },
    apply: (ctx, draft) => {
        const name = readString(ctx.argument(0));
        if (name !== undefined) {
            draft.in = ParamKind.BodyProp;
            draft.name = name;
        } else {
            draft.in = ParamKind.Body;
        }
    },
});

const dHeaderHandler = parameter({
    match: { name: 'DHeader', on: 'parameter' },
    apply: (ctx, draft) => {
        draft.in = ParamKind.Header;
        const name = readString(ctx.argument(0));
        if (name) draft.name = name;
    },
});

// `@DHeaders()` binds the whole headers object → not representable as a single
// OpenAPI parameter, so it's modelled as `Header` with no specific name.
const dHeadersHandler = parameter({
    match: { name: 'DHeaders', on: 'parameter' },
    apply: (_ctx, draft) => { draft.in = ParamKind.Header; },
});

const dCookieHandler = parameter({
    match: { name: 'DCookie', on: 'parameter' },
    apply: (ctx, draft) => {
        draft.in = ParamKind.Cookie;
        const name = readString(ctx.argument(0));
        if (name) draft.name = name;
    },
});

const dCookiesHandler = parameter({
    match: { name: 'DCookies', on: 'parameter' },
    apply: (_ctx, draft) => { draft.in = ParamKind.Cookie; },
});

const dPathHandler = parameter({
    match: { name: 'DPath', on: 'parameter' },
    apply: (ctx, draft) => {
        draft.in = ParamKind.Path;
        const name = readString(ctx.argument(0));
        if (name) draft.name = name;
    },
});

const dPathsHandler = parameter({
    match: { name: 'DPaths', on: 'parameter' },
    apply: (_ctx, draft) => { draft.in = ParamKind.Path; },
});

export function buildParameterHandlers(): ParameterHandler[] {
    return [
        dContextHandler,
        dRequestHandler,
        dResponseHandler,
        dNextHandler,
        dQueryHandler,
        dBodyHandler,
        dHeaderHandler,
        dHeadersHandler,
        dCookieHandler,
        dCookiesHandler,
        dPathHandler,
        dPathsHandler,
    ];
}
