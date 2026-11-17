---
title: Cookie Recipes
description: Task-oriented samples for reading and writing cookies with @routup/cookie.
relatedPlugins: [basic]
---

# Recipes

## Session Cookie

Login sets a cookie the browser keeps for a week and does not expose to scripts; logout clears it.

<<< @/../examples/cookie/session.ts

```bash
curl -i -X POST http://localhost:3000/login
# set-cookie: session=1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed; Max-Age=604800; Path=/; HttpOnly; Secure; SameSite=Lax
curl -i -X POST http://localhost:3000/logout
# set-cookie: session=; Max-Age=0; Path=/
```

The cookie only carries the token; validating it is up to your authentication code. Cookies are not signed, so never store a value in one that the client must not be able to change.

## Store a JSON Value

A cookie value is a string. Serialise structured data with `JSON.stringify()`; the default encoding makes the quotes and braces safe for the header, and parsing decodes them again.

<<< @/../examples/cookie/json-value.ts

```bash
curl -i -X PUT http://localhost:3000/preferences/dark
# set-cookie: preferences=%7B%22theme%22%3A%22dark%22%2C%22language%22%3A%22en%22%7D; Max-Age=31536000; Path=/
curl http://localhost:3000/preferences -H 'cookie: preferences=%7B%22theme%22%3A%22dark%22%2C%22language%22%3A%22en%22%7D'
# {"theme":"dark","language":"en"}
```

The client can send anything, so the route falls back to the defaults when the value does not parse.

## Default a Missing Cookie

`setRequestCookies()` changes what later handlers read, here a locale for clients that sent none. It sends nothing to the client.

<<< @/../examples/cookie/default-cookie.ts

```bash
curl http://localhost:3000/
# {"locale":"en"}
curl http://localhost:3000/ -H 'cookie: locale=fr'
# {"locale":"fr"}
```
