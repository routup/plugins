---
title: Logger Recipes
description: Task-oriented samples for the request logger.
relatedPlugins: []
---

# Recipes

## Custom Format and Tokens

A format string picks the fields; a custom token adds one the built-ins do not have. Here the user that an auth handler stores on `event.store`, which the token reads after the response, and a request header.

<<< @/../examples/logger/custom-format.ts

```bash
curl -H 'authorization: Bearer ada-token' -H 'x-request-id: r-1' http://localhost:3000/
# server output:
# GET / 200 0 ms user=ada id=r-1
```

## Skip Requests

`skip` gets the event and the response, so it can drop a path, a status range or both. This logger writes only failed requests and never the health check.

<<< @/../examples/logger/skip.ts

```bash
curl http://localhost:3000/        # no line
curl http://localhost:3000/admin
# server output:
# GET /admin 403 - - 0.081 ms
```

## JSON Lines

A `Formatter` function returns the whole line, so it can write JSON for a log collector. The tokens are available as functions.

<<< @/../examples/logger/json-lines.ts

```bash
curl http://localhost:3000/
# server output:
# {"method":"GET","url":"/","status":200,"ms":0.2}
```

## Write to a File

`write` receives each line without a newline; here it appends to a file stream. The same shape sends lines to any stream or structured logger.

<<< @/../examples/logger/file-stream.ts

```bash
curl -u ada:secret -e https://example.com/ 'http://localhost:3000/?page=2'
cat access.log
# ::1 - ada [17/Nov/2026:10:21:03 +0000] "GET /?page=2 HTTP/1.1" 200 - "https://example.com/" "curl/8.7.1"
```

The first field is the client address as the server reports it (`::1` for curl on the same machine); it is `-` when there is none, such as for `app.fetch()` in a test.

## Extend the Dev Format

[`devFormatter`](/logger/helpers#devformatter) is a `Formatter` like any other, so a function can call it and add fields.

<<< @/../examples/logger/extend-dev.ts

```bash
curl http://localhost:3000/
# server output (200 in green):
# GET / 200 0.412 ms - - pid=4242
```
