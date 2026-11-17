---
title: Query Helpers
description: Reading and overriding the parsed query with @routup/query.
relatedPlugins: [basic]
---

# Helpers and API

Everything `@routup/query` exports. Each helper takes the routup event first; options are on [Configuration](/query/configuration).

## `query()`

Creates the plugin. It is also the default export.

```typescript
declare function query(options?: Options): Plugin;
```

## `useRequestQuery()`

Returns the parsed query of the request; with a key, one value of it.

```typescript
declare function useRequestQuery(
    event: IAppEvent,
): Record<string, any>;

declare function useRequestQuery(
    event: IAppEvent,
    key: string,
): any;
```

When the `query()` middleware has not run for the request, it returns `{}`, or `undefined` for a key. The values are typed `any`; check and convert them before use ([Read and Convert Values](/query/recipes#read-and-convert-values)).

## `setRequestQuery()`

Changes the stored query that later handlers read: a key and value merge one entry in, a record replaces the whole query ([Default a Missing Value](/query/recipes#default-a-missing-value)).

```typescript
declare function setRequestQuery(
    event: IAppEvent,
    key: string,
    value: unknown,
): void;

declare function setRequestQuery(
    event: IAppEvent,
    record: Record<string, any>,
): void;
```

It does not change `event.request.url` or `event.searchParams`. Called before `query()` runs, it also stops the middleware from parsing the URL.

## `hasRequestQuery()`

Returns `true` once a query object is stored for the request, by the middleware or by `setRequestQuery()`.

```typescript
declare function hasRequestQuery(
    event: IAppEvent,
): boolean;
```

## Types

| Type | Definition |
|------|------------|
| `Options` | `{ parse?: ParseOptions }` ([Configuration](/query/configuration)) |
| `ParseOptions` | qs `IParseOptions` ([`parse`](/query/configuration#parse)) |
