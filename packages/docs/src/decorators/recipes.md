---
title: Decorators Recipes
description: Task-oriented samples for the decorators plugin.
relatedPlugins: [basic, body]
---

# Recipes

## A CRUD Controller

A controller for one resource, with a store passed to its constructor: the instance goes into `controllers`, since a class would be created without arguments. `@DStatus()` sets `201` and `204`, and `createError()` from routup answers `400` and `404`. The sample registers `body()` for `@DBody()`, so install `@routup/body` next to the decorators:

```bash
npm install @routup/body
```

<<< @/../examples/decorators/crud.ts

```bash
curl -X POST http://localhost:3000/todos -H 'content-type: application/json' -d '{"title":"Write docs"}'
# {"id":"1","title":"Write docs","done":false}   (201)
curl -X PATCH http://localhost:3000/todos/1 -H 'content-type: application/json' -d '{"done":true}'
# {"id":"1","title":"Write docs","done":true}
curl -X DELETE http://localhost:3000/todos/1
#    (204, no body)
curl http://localhost:3000/todos/1
# {"status":404,"message":"todo 1 not found"}
curl -X POST http://localhost:3000/todos -H 'content-type: application/json' -d '{}'
# {"status":400,"message":"title must be a non-empty string"}
```

## A Controller With Middleware

`RequireToken` guards every request under `/account`; `MarkAudited` runs only for `GET /account`. A middleware passes data to the method through `event.store`.

<<< @/../examples/decorators/middleware.ts

```bash
curl http://localhost:3000/account
# {"status":401,"message":"Unauthorized"}
curl -i -H 'authorization: Bearer secret' http://localhost:3000/account
# x-audited: true
#
# {"user":"ada"}
curl -H 'authorization: Bearer secret' http://localhost:3000/account/settings
# {"theme":"dark"}
```

The class middleware also runs for a path under `/account` that no method answers, so `/account/unknown` gets `401` without the token and `404` with it.

## Body, Query and Cookies

`basic()` registers the body, cookie and query parsers in one call; the decorators then take the whole value or one key of it. [Decorators and the Parsers](/guide/combining#decorators-and-the-parsers) shows the same with the three plugins registered one by one. Install `@routup/basic` next to the decorators:

```bash
npm install @routup/basic
```

<<< @/../examples/decorators/cart.ts

```bash
curl -H 'cookie: cart=c-42' 'http://localhost:3000/cart?filter[sku]=pen'
# {"cart":"c-42","query":{"filter":{"sku":"pen"}}}
curl -X POST 'http://localhost:3000/cart/items?currency=USD' \
    -H 'cookie: cart=c-42' \
    -H 'content-type: application/json' \
    -d '{"sku":"pen","quantity":2}'
# {"cart":"c-42","item":{"sku":"pen","quantity":2},"currency":"USD"}
```

## Controllers Under a Path Prefix

`app.use(path, plugin)` installs the plugin under a path, so every controller path gets the prefix; `getControllerRoutes()` still lists the paths without it.

<<< @/../examples/decorators/prefix.ts

```bash
curl http://localhost:3000/api/v1/users
# [{"id":"1"}]
curl http://localhost:3000/api/v1/teams
# [{"id":"t1"}]
```

To mount one controller under several paths of its own, give `@DController()` an array ([Controller Class](/decorators/controllers#dcontroller)).
