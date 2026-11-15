<p align="center">
    <img src="https://cdn.jsdelivr.net/npm/@routup/rate-limit@4/assets/logo.svg" alt="@routup/rate-limit logo: a round limit sign showing 429 above a row of five dots" width="128" height="128" />
</p>

<h1 align="center">@routup/rate-limit</h1>

<p align="center">
    <b>Limit how many requests each client can make per time window, with RateLimit headers and pluggable stores.</b><br>
    You set a window and a quota; the middleware counts hits per client, sets the headers and answers <code>429</code> once the quota is used up.
</p>

<p align="center">
    <a href="https://www.npmjs.com/package/@routup/rate-limit"><img src="https://img.shields.io/npm/v/@routup/rate-limit" alt="npm version" /></a>
    <a href="https://github.com/routup/plugins/actions/workflows/main.yml"><img src="https://github.com/routup/plugins/actions/workflows/main.yml/badge.svg" alt="CI" /></a>
    <a href="https://codecov.io/gh/routup/plugins"><img src="https://codecov.io/gh/routup/plugins/branch/master/graph/badge.svg" alt="Coverage" /></a>
    <a href="https://snyk.io/test/github/routup/plugins"><img src="https://snyk.io/test/github/routup/plugins/badge.svg" alt="Known Vulnerabilities" /></a>
</p>

<p align="center">
    <a href="#installation"><b>Installation</b></a>
    ·
    <a href="#usage">Usage</a>
    ·
    <a href="#options">Options</a>
    ·
    <a href="#api">API</a>
    ·
    <a href="https://plugins.routup.dev/rate-limit/">Docs</a>
</p>

---

## Why @routup/rate-limit?

A login form, a password reset or a public API needs a cap on how often one client can call it. Doing it by hand means a counter keyed by IP, a timer to reset it, the `RateLimit-*` and `Retry-After` headers, and the decision whether failed or successful requests count. This middleware does that, and lets you move the counters to Redis when you run more than one process.

| Concern | Without it | With @routup/rate-limit |
|---------|------------|-------------------------|
| Counting | A `Map` of hits per IP plus a reset timer | `MemoryStore` counts per key and resets every `windowMs` |
| Client identity | Read `X-Forwarded-For` or the socket address yourself | `getRequestIP(event, { trustProxy: true })` by default, replaceable with `keyGenerator` |
| Headers | Compute and set limit, remaining and reset values | `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`, and `Retry-After` when blocked |
| Rejection | Return a status and body in every guarded route | `statusCode` (`429`) and `message`, or your own `handler` |
| Which requests count | Undo the counter after the response | `skipFailedRequest`, `skipSuccessfulRequest`, `requestWasSuccessful` |
| Multiple instances | Share the counter yourself | Swap in a `Store`, such as [`@routup/rate-limit-redis`](https://www.npmjs.com/package/@routup/rate-limit-redis) |

```typescript
import { App, serve } from 'routup';
import { rateLimit } from '@routup/rate-limit';

const app = new App();

app.use(rateLimit({
    // 15 minutes
    windowMs: 15 * 60 * 1000,

    // Limit each IP to 100 requests
    // per `window` (here, per 15 minutes)
    max: 100,
}));

serve(app, { port: 3000 });
```

## Installation

```bash
npm install @routup/rate-limit
```

ESM only, Node.js >=22. Peer dependency: `routup@^6.1.0`.

## Usage

### Limit an app or a path

```typescript
import { App, defineCoreHandler } from 'routup';
import { rateLimit } from '@routup/rate-limit';

const app = new App();

// only requests below /auth count, with their own quota
app.use('/auth', rateLimit({ windowMs: 60_000, max: 5 }));

app.post('/auth/login', defineCoreHandler(() => ({ ok: true })));
```

- `rateLimit()` returns a routup handler, not a plugin: mount it with `app.use()`, with or without a path.
- Mount it before the routes it guards.
- Every request that is not skipped increments the client's counter, including requests that are then rejected.
- Once the counter exceeds `max`, the request is answered by `handler` (by default `statusCode` and `message`) and the downstream handlers are not called.

### Response headers

Each request that is counted gets these headers:

| Header | Value |
|--------|-------|
| `RateLimit-Limit` | The quota (`max`) for this request |
| `RateLimit-Remaining` | Requests left in the current window, never below `0` |
| `RateLimit-Reset` | Seconds until the store resets the counter (only when the store returns a `resetTime`) |
| `Retry-After` | `windowMs` in whole seconds, only on a rejected request |

Requests for which `skip` returns `true` get none of them.

### Count only failed (or only successful) requests

```typescript
import { App } from 'routup';
import { rateLimit } from '@routup/rate-limit';

const app = new App();

// only failed login attempts count towards the limit
app.use('/auth/login', rateLimit({
    max: 5,
    skipSuccessfulRequest: true,
}));
```

- After the downstream response, the middleware asks `requestWasSuccessful(event, response)` (default: `response.status < 400`) and decrements the counter again when the request should not count.
- `RateLimit-Remaining` on that response is updated to the decremented value.
- A request whose handler throws is judged by the response of the error handler that answers it. When no error handler is registered, the middleware sees no response at all and counts the request as not successful, whatever its status.

### Read the limit state in a handler

```typescript
import { App, defineCoreHandler } from 'routup';
import { rateLimit, useRequestRateLimitInfo } from '@routup/rate-limit';

const app = new App();

app.use(rateLimit({ max: 100 }));

app.get('/quota', defineCoreHandler((event) => {
    const { limit, remaining, resetTime } = useRequestRateLimitInfo(event);

    return { limit, remaining, resetTime };
}));
```

The middleware stores `limit`, `current`, `remaining` and `resetTime` on the event before it calls the next handler. Pass a key to read one value: `useRequestRateLimitInfo(event, 'remaining')`.

### Store

The `store` option decides where the hit counts live. The default `MemoryStore` keeps them in the process memory. To create a custom store, implement the `Store` interface:

```typescript
import type { IncrementResponse, Options, Store } from '@routup/rate-limit';
import { calculateNextResetTime } from '@routup/rate-limit';

declare const db: {
    incr(key: string, ttlMs: number): Promise<number>,
    decr(key: string): Promise<void>,
    del(key: string): Promise<void>,
};

class DatabaseStore implements Store {
    windowMs = 60_000;

    init(options: Options) {
        this.windowMs = options.windowMs;
    }

    async increment(key: string): Promise<IncrementResponse> {
        const totalHits = await db.incr(key, this.windowMs);

        return { totalHits, resetTime: calculateNextResetTime(this.windowMs) };
    }

    async decrement(key: string) {
        await db.decr(key);
    }

    async reset(key: string) {
        await db.del(key);
    }
}
```

| Method | Required | Called |
|--------|----------|--------|
| `init(options)` | no | Once, when the middleware is created, with the resolved options |
| `increment(key)` | yes | For every counted request; returns `{ totalHits, resetTime }` |
| `decrement(key)` | yes | When `skipFailedRequest` or `skipSuccessfulRequest` removes a request again |
| `reset(key)` | yes | Not called by the middleware; for your own code (for example after a successful login) |

The following adapters are officially provided:

- [@routup/rate-limit-redis](https://www.npmjs.com/package/@routup/rate-limit-redis)

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `windowMs` | `number` | `60000` (1 minute) | Time frame in ms for which hits are remembered; also the `Retry-After` value |
| `max` | `number \| (event) => number \| Promise<number>` | `5` | Requests allowed per window per key; `0` never rejects |
| `message` | `any \| (event) => any \| Promise<any>` | `'Too many requests, please try again later.'` | Response body of a rejected request (default `handler` only) |
| `statusCode` | `number` | `429` | Response status of a rejected request (default `handler` only) |
| `skipFailedRequest` | `boolean` | `false` | Do not count requests that `requestWasSuccessful` rejects |
| `skipSuccessfulRequest` | `boolean` | `false` | Do not count requests that `requestWasSuccessful` accepts |
| `requestWasSuccessful` | `(event, response) => boolean` | `response.status < 400` | Decides what counts as successful |
| `keyGenerator` | `(event) => string \| Promise<string>` | `getRequestIP(event, { trustProxy: true }) \|\| '127.0.0.1'` | Identifies the client |
| `handler` | `(event, options) => unknown` | Sets `statusCode`, returns `message` | Builds the response of a rejected request |
| `skip` | `(event) => boolean \| Promise<boolean>` | `() => false` | Return `true` to bypass the limiter for a request |
| `store` | `Store` | `new MemoryStore()` | Where hit counts are kept |

### `windowMs`

> `number`

Time frame for which requests are checked/remembered. Also used in the `Retry-After` header when the limit is reached.

Defaults to `60000` ms (= 1 minute).

### `max`

> `number | function`

The maximum number of requests to allow during the window before rate limiting the client.

Can be the limit itself as a number or a (sync/async) function that accepts the routup `event` and returns a number.

Defaults to `5`. Set it to `0` to turn off rejections; hits are still counted and the headers are still set (with a limit of `0`).

An example of using a function:

```typescript
import { getRequestIP } from 'routup';
import { rateLimit } from '@routup/rate-limit';

declare function isPremium(ip: string): Promise<boolean>;

const limiter = rateLimit({
    max: async (event) => {
        const ip = getRequestIP(event, { trustProxy: true }) || '127.0.0.1';

        return (await isPremium(ip)) ? 10 : 5;
    },
});
```

### `message`

> `any | function`

The response body to send back when a client is rate limited.

May be a `string`, a JSON object or any other value routup can turn into a response. It can also be a (sync/async) function that accepts the routup `event` and returns such a value.

Defaults to `'Too many requests, please try again later.'`

An example of using a function:

```typescript
import type { IAppEvent } from 'routup';
import { getRequestIP } from 'routup';
import { rateLimit } from '@routup/rate-limit';

declare function isPremium(ip: string): Promise<boolean>;

const limiter = rateLimit({
    // `message` accepts any value, so annotate the event
    message: async (event: IAppEvent) => {
        const ip = getRequestIP(event, { trustProxy: true }) || '127.0.0.1';

        if (await isPremium(ip)) {
            return 'You can only make 10 requests every hour.';
        }

        return 'You can only make 5 requests every hour.';
    },
});
```

### `statusCode`

> `number`

The HTTP status code to send back when a client is rate limited.

Defaults to `429` (HTTP 429 Too Many Requests, RFC 6585).

### `skipFailedRequest`

> `boolean`

When set to `true`, failed requests are not counted. A request is considered failed when the `requestWasSuccessful` option returns `false`. By default, this means requests fail when the response status is >= 400.

Defaults to `false`.

### `skipSuccessfulRequest`

> `boolean`

When set to `true`, requests that `requestWasSuccessful` considers successful are not counted. By default, this means requests succeed when the response status code is < 400. This is the usual setting for login endpoints: only failed attempts count.

Defaults to `false`.

### `keyGenerator`

> `function`

Method to generate custom identifiers for clients.

Should be a (sync/async) function that accepts the routup `event` and returns a string.

By default, the client's IP address is used, falling back to `'127.0.0.1'`:

```typescript
import { getRequestIP } from 'routup';
import { rateLimit } from '@routup/rate-limit';

const limiter = rateLimit({
    keyGenerator: (event) => getRequestIP(event, { trustProxy: true }) || '127.0.0.1',
});
```

Key by something else, such as an API token, to limit per account instead of per IP:

```typescript
import { getRequestHeader, getRequestIP } from 'routup';
import { rateLimit } from '@routup/rate-limit';

const limiter = rateLimit({
    keyGenerator: (event) => getRequestHeader(event, 'x-api-key') ?? getRequestIP(event) ?? 'anonymous',
});
```

### `handler`

> `function`

Handler that sends back a response when a client is rate limited. Its return value becomes the response body.

By default, it sets the `statusCode` and returns the `message` (calling it first when it is a function). A custom handler that answers with JSON:

```typescript
import { rateLimit, useRequestRateLimitInfo } from '@routup/rate-limit';

const limiter = rateLimit({
    handler(event, options) {
        event.response.status = options.statusCode;

        return {
            error: 'rate_limited',
            resetTime: useRequestRateLimitInfo(event, 'resetTime'),
        };
    },
});
```

### `skip`

> `function`

Function to determine whether this request counts towards a client's quota. Should be a (sync/async) function that accepts the routup `event` and returns `true` (bypass the limiter) or `false`.

Could also act as an allow list for certain keys:

```typescript
import { getRequestIP } from 'routup';
import { rateLimit } from '@routup/rate-limit';

const allowlist = ['192.168.0.56', '192.168.0.21'];

const limiter = rateLimit({
    skip: (event) => allowlist.includes(getRequestIP(event) ?? ''),
});
```

By default, it skips no requests:

```typescript
import { rateLimit } from '@routup/rate-limit';

const limiter = rateLimit({
    skip: () => false,
});
```

### `requestWasSuccessful`

> `function`

Method to determine whether the request counts as 'successful'. Used when either `skipSuccessfulRequest` or `skipFailedRequest` is set to `true`. Should be a function that accepts the routup `event` and the downstream `Response` object and returns `true` or `false`.

By default, requests with a response status code less than 400 are considered successful:

```typescript
import { rateLimit } from '@routup/rate-limit';

const limiter = rateLimit({
    requestWasSuccessful: (event, response) => response.status < 400,
});
```

A request whose handler throws is judged by the response of the error handler that answers it. When no error handler is registered, the middleware sees no response at all and counts the request as not successful, whatever its status.

### `store`

> `Store`

The `Store` to use to store the hit count for each client. Defaults to a new `MemoryStore`. See [Store](#store).

## API

| Export | Kind | Purpose |
|--------|------|---------|
| `rateLimit(options?)` | function (default export) | Creates the rate-limit handler |
| `createHandler(options?)` | function | Same as `rateLimit()` |
| `useRequestRateLimitInfo(event, key?)` | function | Reads the `RateLimitInfo` the middleware stored for this request (`{}` or `undefined` when it did not run) |
| `setRequestRateLimitInfo(event, record)` / `(event, key, value)` | function | Writes or merges into that record |
| `MemoryStore` | class | Default in-process store |
| `calculateNextResetTime(windowMs)` | function | `new Date()` plus `windowMs`, for custom stores |
| `normalizeHandlerOptions(input?)` | function | Applies the defaults to an options input |
| `isObject(value)` | function | Plain-object check used internally |
| `RETRY_AGAIN_MESSAGE` | constant | The default `message` |
| `Store` | interface | Contract for custom stores |
| `Options`, `OptionsInput` | type | Resolved and partial options |
| `RateLimitInfo` | type | `{ limit, current, remaining, resetTime? }` |
| `IncrementResponse` | type | `{ totalHits, resetTime }`, returned by `Store.increment` |
| `ValueDeterminingMiddleware<T>` | type | `(event) => T \| Promise<T>`, used by `max`, `message`, `keyGenerator`, `skip` |
| `RateLimitExceededEventHandler` | type | Signature of `handler` |

## Notes

- **`MemoryStore` is per process and uses a fixed window.** All counters are cleared together every `windowMs`, counted from when the middleware was created, not from each client's first request. A client can therefore make up to `2 * max` requests across a window boundary. Counters are not shared between processes or instances; use a shared store such as [`@routup/rate-limit-redis`](https://www.npmjs.com/package/@routup/rate-limit-redis) for that.
- **`Retry-After` is always the full window.** It is `windowMs` in seconds, not the time left until the reset. `RateLimit-Reset` carries the time left.
- **The default key trusts `X-Forwarded-For`.** `getRequestIP(event, { trustProxy: true })` takes the client address from the header, which a client can set itself when the app is not behind a proxy that overwrites it. Pass your own `keyGenerator` (for example `getRequestIP(event)` without `trustProxy`) when the app is reachable directly.
- **Rejected requests count too.** A blocked client keeps incrementing its counter until the window resets.
- **One store per limiter.** `init()` runs for each `rateLimit()` call; passing the same `MemoryStore` instance to two limiters re-initializes it and starts a second reset timer.
- **`max` is resolved after the increment**, so a `max` function runs only for requests that are counted (not for skipped ones).

## License

Made with 💚

Published under [MIT License](https://github.com/routup/plugins/blob/master/LICENSE).

This library is heavily inspired by
[express-rate-limit](https://www.npmjs.com/package/express-rate-limit).
