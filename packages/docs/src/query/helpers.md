---
title: Query — Helpers
description: Reading parsed query parameters.
relatedPlugins: [basic]
---

# Helpers

## `useRequestQuery`

Returns the parsed query parameters. Pass a key to read a single value.

```typescript
declare function useRequestQuery(
    event: IRoutupEvent,
): Record<string, any>;

declare function useRequestQuery(
    event: IRoutupEvent,
    key: string,
): any;
```

```typescript
const all = useRequestQuery(event);
const page = useRequestQuery(event, 'page');
```

## `setRequestQuery`

Override the cached parsed query (e.g. inside a middleware that normalizes paginators). Either set a single key or replace the whole record.

```typescript
declare function setRequestQuery(
    event: IRoutupEvent,
    key: string,
    value: unknown,
): void;

declare function setRequestQuery(
    event: IRoutupEvent,
    record: Record<string, any>,
): void;
```
