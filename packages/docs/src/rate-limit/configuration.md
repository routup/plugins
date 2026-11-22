---
title: Rate-limit Configuration
description: All options accepted by the rate-limit middleware.
relatedPlugins: [rate-limit-redis]
---

# Configuration

`rateLimit(options?)` takes one object; every option is optional. The options are the `Options` type, the input is `OptionsInput` (`Partial<Options>`).

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `windowMs` | `number` | `60000` (1 minute) | Time frame in ms for which hits are remembered; also the `Retry-After` value (in seconds) |
| `max` | `number \| (event) => number \| Promise<number>` | `5` | Requests allowed per window per key; `0` never rejects |
| `message` | `any \| (event) => any \| Promise<any>` | `'Too many requests, please try again later.'` | Response body of a rejected request (default `handler` only) |
| `statusCode` | `number` | `429` | Response status of a rejected request (default `handler` only) |
| `skipFailedRequest` | `boolean` | `false` | Do not count requests that `requestWasSuccessful` rejects |
| `skipSuccessfulRequest` | `boolean` | `false` | Do not count requests that `requestWasSuccessful` accepts |
| `countAfterResponse` | `boolean` | `false` | Count a request after its response instead of before forwarding it; needs a store with `get()` |
| `requestWasSuccessful` | `(event, response) => boolean` | `response.status < 400` | Decides what counts as successful |
| `trustProxy` | `boolean \| number \| string \| string[] \| (address, hop) => boolean` | `true` | Proxies the default `keyGenerator` trusts for `X-Forwarded-For` |
| `keyGenerator` | `(event) => string \| Promise<string>` | `getRequestIP(event, { trustProxy }) \|\| '127.0.0.1'` | Identifies the client |
| `handler` | `(event, options) => unknown` | Sets `statusCode`, returns `message` | Builds the response of a rejected request |
| `skip` | `(event) => boolean \| Promise<boolean>` | `() => false` | Return `true` to bypass the limiter for a request |
| `store` | `Store` | `new MemoryStore()` | Where hit counts are kept |

### `windowMs`

The window length in milliseconds. The default `MemoryStore` clears all counters together every `windowMs`, counted from when `rateLimit()` was called ([`MemoryStore`](/rate-limit/helpers#memorystore)). In seconds, rounded up, it is also the `Retry-After` value of a rejected request ([Response Headers](/rate-limit/#response-headers)).

### `max`

The quota per key and window, as a number or a function of the event (sync or async). A function runs once per request that `skip` lets through, after the counter was incremented (with [`countAfterResponse`](#countafterresponse): after it was read). [Tiered Quota](/rate-limit/recipes#tiered-quota) shows a function.

With `0`, no request is rejected, but hits are still counted and the headers are still set, with `RateLimit-Limit: 0`.

### `message`

The body the default `handler` returns: a string, a JSON-serialisable value or anything else routup turns into a response. A function is called with the event (sync or async) and its return value is used; it receives the event untyped, so annotate the parameter as `IAppEvent`. A `null` or `undefined` result falls back to the default text.

### `skipFailedRequest`

When `true`, a request that `requestWasSuccessful` judges unsuccessful is not counted: the counter is decremented after the response and `RateLimit-Remaining` on that response is raised again.

### `skipSuccessfulRequest`

The reverse of `skipFailedRequest`: successful requests are not counted. This is the usual setting for a login route, where only failed attempts should use up the quota ([Count Only Failed Requests](/rate-limit/recipes#count-only-failed-requests)).

### `countAfterResponse`

Decides when a request is counted. By default, every request reserves a slot before it is forwarded, and `skipFailedRequest` or `skipSuccessfulRequest` gives the slot back after the response. With `true`, the middleware reads the current hits with the store's `get()`, rejects the request when they reached `max`, forwards it, and increments the counter only when the response is not skipped. A rejected request is not counted.

| | Default (reserve, then refund) | `countAfterResponse: true` |
|---|---|---|
| Pending requests | Hold a slot until their response is known, so many slow requests that will be refunded, such as long-polls or uploads, can get the next request rejected | Hold no slot |
| Concurrent requests | Each request reserves a slot before it is forwarded, so with a store whose increment is atomic, such as `MemoryStore`, no more than `max` are pending at a time; a refund frees its slot for a later request. `RedisStore` reads and writes the counter in two commands, so concurrent requests can exceed `max` | All that arrive before the first of them is counted pass, so a burst can exceed `max` |
| Headers and `useRequestRateLimitInfo()` | Count the request itself while it runs; corrected after a refund | Show the state before the request while it runs; the response carries the state after it was counted |

It is meant for `skipFailedRequest` or `skipSuccessfulRequest`; without either, every response is counted. `rateLimit()` throws when the option is set and the store has no `get()` method; [`MemoryStore`](/rate-limit/helpers#memorystore) and [`RedisStore`](/rate-limit-redis/#redisstore) have one. [Count After the Response](/rate-limit/recipes#count-after-the-response) shows it.

### `requestWasSuccessful`

Called with the event and the downstream `Response` when `skipFailedRequest` or `skipSuccessfulRequest` is set. It must return a boolean synchronously.

A request whose handler throws is judged by the response of the [error handler](https://routup.dev/guide/error-handling) that answers it. When no error handler answers, the middleware sees no response at all and treats the request as not successful, whatever status the fallback response gets.

### `trustProxy`

Which proxies the default `keyGenerator` trusts when it takes the client address from `X-Forwarded-For`, passed to routup's [`getRequestIP()`](https://routup.dev/api/request-helpers): `true` trusts every proxy, `false` none, so the address of the connection is the key. A hop count, an address or CIDR (also a list of them) or a function `(address, hop) => boolean` trusts only those proxies. `undefined` uses the `trustProxy` option of the app. A custom `keyGenerator` does not read it.

<<< @/../examples/rate-limit/trust-proxy.ts

### `keyGenerator`

Returns the key a request is counted under (sync or async). Keying by something other than the address, such as an API token, limits per account:

<<< @/../examples/rate-limit/key-by-token.ts

The default key trusts `X-Forwarded-For` ([`trustProxy`](#trustproxy) is `true`): the client address comes from that header, which a client can set itself when the app is not behind a proxy that overwrites it. When the app is reachable directly, set `trustProxy: false`; behind your own proxies, list them. Requests without a client address, such as calls to `app.fetch()` in tests, all share the key `'127.0.0.1'`.

### `handler`

Answers a rejected request; its return value becomes the response. It runs after the headers were set, including `Retry-After`. The default sets `statusCode` and returns `message`. A handler that answers with JSON:

<<< @/../examples/rate-limit/json-handler.ts

The second argument is the resolved `Options`. Returning a `Response` object drops the rate-limit headers, since they live on `event.response`.

### `skip`

Returns `true` (sync or async) to pass a request on without counting it and without any rate-limit header, for example for an allowlist:

<<< @/../examples/rate-limit/allowlist.ts

### `store`

Where the counters live: a [`Store`](/rate-limit/helpers#store) implementation, by default a new [`MemoryStore`](/rate-limit/helpers#memorystore). Its `init()` is called once with the resolved options when `rateLimit()` runs, so give each limiter its own store instance. A store without `get()` cannot be used with `countAfterResponse`. For a store shared between instances, see [`@routup/rate-limit-redis`](/rate-limit-redis/); to write one, see [Custom Store](/rate-limit/recipes#custom-store).
