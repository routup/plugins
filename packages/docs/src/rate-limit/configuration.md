---
title: Rate-limit — Configuration
description: All options accepted by the rate-limit plugin.
relatedPlugins: [rate-limit-redis]
---

# Configuration

```typescript
router.use(rateLimit({
    windowMs: 60_000,
    max: 5,
    keyGenerator: (event) => getRequestIP(event, { trustProxy: true }),
    store: new RedisStore(),
}));
```

## Options

### `windowMs`

- **Type**: `number`
- **Default**: `60000` (1 minute)

Time frame (ms) for which requests are remembered. Also used as the `Retry-After` value when the limit is reached.

### `max`

- **Type**: `number | ((event) => number | Promise<number>)`
- **Default**: `5`

Maximum requests per window per client. `0` disables the limiter entirely. The callback form lets you tier limits per request — for example, premium users get a higher quota:

```typescript
import { getRequestIP } from 'routup';

router.use(rateLimit({
    max: async (event) => {
        const ip = getRequestIP(event, { trustProxy: true }) ?? '127.0.0.1';
        return (await isPremium(ip)) ? 10 : 5;
    },
}));
```

### `message`

- **Type**: `any | ((event) => any | Promise<any>)`
- **Default**: `'Too many requests, please try again later.'`

The response body when a client is rate-limited. Strings, JSON objects, or any value `toResponse()` can serialize.

### `statusCode`

- **Type**: `number`
- **Default**: `429`

HTTP status returned when limited. Stick with `429` (RFC 6585) unless you have a reason.

### `skipFailedRequest`

- **Type**: `boolean`
- **Default**: `false`

Don't count requests considered "failed" (default: response status ≥ 400). Useful if you want to limit successful traffic only.

### `skipSuccessfulRequest`

- **Type**: `boolean`
- **Default**: `false`

The complement: skip requests considered "successful" (default: status < 400). Common pattern for login endpoints — only failed login attempts count toward the limit.

### `keyGenerator`

- **Type**: `(event) => string | Promise<string>`
- **Default**: client IP via `getRequestIP(event, { trustProxy: true })`

Identifies a client. Override to key by user ID, API token, or `(IP, route)` pairs:

```typescript
keyGenerator: (event) => {
    const userId = useRequestCookie(event, 'user-id');
    return userId ?? getRequestIP(event);
}
```

### `handler`

- **Type**: `(event, options) => any`
- **Default**: writes `statusCode` + `message` to the response

Custom rejection logic. Returns whatever you want `toResponse()` to serialize.

### `skip`

- **Type**: `(event) => boolean | Promise<boolean>`
- **Default**: `() => false`

Bypass the limiter for matching requests — typical pattern is an internal IP allowlist:

```typescript
const allowlist = ['10.0.0.0/8'];
skip: (event) => allowlist.some((cidr) => matchCidr(getRequestIP(event), cidr))
```

### `requestWasSuccessful`

- **Type**: `(event, response) => boolean`
- **Default**: `(_, response) => response.status < 400`

Defines what "successful" means for `skipFailedRequest` / `skipSuccessfulRequest`.

### `store`

- **Type**: `Store`
- **Default**: in-memory store

The hit-count backend. See [`@routup/rate-limit-redis`](/rate-limit-redis/) for a Redis-backed implementation, or implement the `Store` interface yourself.
