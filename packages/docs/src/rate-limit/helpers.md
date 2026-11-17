---
title: Rate-limit Helpers
description: Functions, the store contract and the types exported by @routup/rate-limit.
relatedPlugins: [rate-limit-redis]
---

# Helpers and API

Everything `@routup/rate-limit` exports. Options are on [Configuration](/rate-limit/configuration).

## `rateLimit()`

Creates the rate-limit handler. It is also the default export.

```typescript
declare function rateLimit(options?: OptionsInput): Handler;
```

## `useRequestRateLimitInfo()`

Reads the `RateLimitInfo` the middleware stored for this request before it called the next handler. With a key, it returns that one value.

```typescript
declare function useRequestRateLimitInfo(
    event: IAppEvent,
): Partial<RateLimitInfo>;

declare function useRequestRateLimitInfo<K extends keyof RateLimitInfo>(
    event: IAppEvent,
    key: K,
): RateLimitInfo[K] | undefined;
```

When the middleware did not run for the request (no match, or `skip` returned `true`), it returns `{}`, or `undefined` for a key. After a request was uncounted again by `skipFailedRequest` or `skipSuccessfulRequest`, `current` and `remaining` hold the corrected values. [Read the Limit State](/rate-limit/recipes#read-the-limit-state) shows it in a handler.

## `setRequestRateLimitInfo()`

Writes the record that `useRequestRateLimitInfo()` reads: a whole record is merged into the existing one, a key and value set one field.

```typescript
declare function setRequestRateLimitInfo(
    event: IAppEvent,
    record: RateLimitInfo,
): void;

declare function setRequestRateLimitInfo<K extends keyof RateLimitInfo>(
    event: IAppEvent,
    key: K,
    value: RateLimitInfo[K],
): void;
```

## `MemoryStore`

The default `Store`, keeping one counter per key in the process memory.

```typescript
declare class MemoryStore implements Store {
    windowMs: number;
    hits: Record<string, number | undefined>;
    resetTime: Date;
    interval?: NodeJS.Timeout;

    init(options: Options): void;
    increment(key: string): Promise<IncrementResponse>;
    decrement(key: string): Promise<void>;
    reset(key: string): Promise<void>;
    resetAll(): Promise<void>;
}
```

- **Fixed window.** `init()` starts an interval that runs `resetAll()` every `windowMs`, clearing all counters together. The windows count from when `rateLimit()` was called, not from each client's first request, so a client can make up to `2 * max` requests across a window boundary. `resetTime` is shared by all keys.
- **Per process.** Counters are not shared between processes or instances; use a shared store such as [`@routup/rate-limit-redis`](/rate-limit-redis/) for that.
- **One store per limiter.** `init()` runs for each `rateLimit()` call; passing the same instance to two limiters clears its counters and starts a second interval. The interval is unref'd, so it does not keep the process alive, and nothing stops it.
- `decrement()` never takes a counter below `0`; `reset()` removes one key.

## `Store`

The interface a custom store implements. [Custom Store](/rate-limit/recipes#custom-store) is a complete one.

```typescript
interface Store {
    init?: (options: Options) => void;
    increment: (key: string) => Promise<IncrementResponse> | IncrementResponse;
    decrement: (key: string) => Promise<void> | void;
    reset: (key: string) => Promise<void> | void;
}
```

| Method | Required | Called |
|--------|----------|--------|
| `init(options)` | no | Once, when `rateLimit()` is called, with the resolved options |
| `increment(key)` | yes | For every counted request; returns `{ totalHits, resetTime }` |
| `decrement(key)` | yes | When `skipFailedRequest` or `skipSuccessfulRequest` uncounts a request |
| `reset(key)` | yes | Never by the middleware; for your own code, for example after a successful login |

When `increment()` returns no `resetTime`, the response has no `RateLimit-Reset` header.

## `calculateNextResetTime()`

Returns the current time plus `windowMs`, for stores that compute their own reset time.

```typescript
declare function calculateNextResetTime(windowMs: number): Date;
```

## Types

| Type | Definition |
|------|------------|
| `Options` | The resolved options, every key required ([Configuration](/rate-limit/configuration)) |
| `OptionsInput` | `Partial<Options>`, the argument of `rateLimit()` |
| `RateLimitInfo` | `{ limit: number; current: number; remaining: number; resetTime?: Date }` |
| `IncrementResponse` | `{ totalHits: number; resetTime: Date \| undefined }`, returned by `Store.increment()` |
| `ValueDeterminingMiddleware<T>` | `(event: IAppEvent) => T \| Promise<T>`, the shape of `max`, `message`, `keyGenerator` and `skip` |
| `RateLimitExceededEventHandler` | `(event: IAppEvent, options: Options) => unknown \| Promise<unknown>`, the shape of `handler` |

## Other Exports

Used by the middleware itself; exported, but rarely needed.

| Export | Description |
|--------|-------------|
| `createHandler` | `createHandler(options?)`: the function behind `rateLimit()`, returning the same handler |
| `normalizeHandlerOptions` | `normalizeHandlerOptions(input?)`: applies the defaults to an `OptionsInput` and returns `Options` |
| `RETRY_AGAIN_MESSAGE` | `'Too many requests, please try again later.'`, the default `message` |
| `isObject` | `isObject(value)`: `true` for a non-null object that is not an array |
