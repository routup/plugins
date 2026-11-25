---
title: Body Recipes
description: Task-oriented samples for reading request bodies with @routup/body.
relatedPlugins: [basic]
---

# Recipes

A complete JSON API that reads its bodies with `@routup/body` is the [REST API example](https://routup.dev/examples/rest-api) on routup.dev.

## JSON With a Size Limit

`limit` caps the body size: for a larger body, `readRequestBody()` throws and the request answers `413`.

<<< @/../examples/body/json-limit.ts

```bash
curl -i -X POST http://localhost:3000/notes \
    -H 'content-type: application/json' \
    -d "{\"text\":\"$(head -c 20000 /dev/zero | tr '\0' x)\"}"
# HTTP/1.1 413 Payload Too Large
#
# {"status":413,"message":"request entity too large"}
```

Since only `json` is set, a form body is not parsed and `readRequestBody()` returns `{}`.

## Reject Other Media Types

`strictContentType` answers `415` for a body that no enabled parser accepts, instead of reading it as `{}` ([Strict Media Types](/body/configuration#strict-media-types)).

<<< @/../examples/body/strict-content-type.ts

```bash
curl -i -X POST http://localhost:3000/notes \
    -H 'content-type: application/vnd.api+json' \
    -d '{"text":"hi"}'
# {"note":{"text":"hi"}}

curl -i -X POST http://localhost:3000/notes \
    -H 'content-type: text/plain' \
    -d 'hi'
# HTTP/1.1 415 Unsupported Media Type
```

## HTML Form

A form posts `application/x-www-form-urlencoded`. A field sent more than once, such as a group of checkboxes, arrives as an array.

<<< @/../examples/body/form.ts

```bash
curl -X POST http://localhost:3000/subscribe -d 'email=ada@example.com&tags=news&tags=releases'
# {"email":"ada@example.com","tags":["news","releases"]}
```

More than 20 fields answer `413` (`too many parameters`).

## Verify a Webhook Signature

A signature is computed over the exact bytes the sender posted, so the route reads them before parsing. With `cache: true` on `raw`, the JSON parser reuses the cached bytes instead of reading the consumed body again.

<<< @/../examples/body/webhook.ts

```bash
payload='{"type":"invoice.paid"}'
signature=$(printf '%s' "$payload" | openssl dgst -sha256 -hmac webhook-secret | sed 's/^.* //')
curl -X POST http://localhost:3000/webhook \
    -H 'content-type: application/json' \
    -H "x-signature: $signature" \
    -d "$payload"
# {"received":"invoice.paid"}
```

`crypto.subtle.verify()` compares in constant time, and Web Crypto runs on every runtime routup supports.

## Plain Text Upload

`readRequestBodyText()` reads the body as a string whatever its `content-type`, here a CSV file.

<<< @/../examples/body/text.ts

```bash
printf 'Ada,ada@example.com\nAlan,alan@example.com\n' | \
    curl -X POST http://localhost:3000/contacts/import -H 'content-type: text/csv' --data-binary @-
# {"imported":2,"contacts":[{"name":"Ada","email":"ada@example.com"},{"name":"Alan","email":"alan@example.com"}]}
```

## A Different Limit per Path

Each `body()` stores its options on the request, and the last one to run wins. A second `body()` mounted under a path raises the limit for the routes below it only.

<<< @/../examples/body/limit-per-path.ts

An array of notes of 24 kB is imported under `/import/notes` and answers `413` under `/notes`. To parse bodies only below a path and not at all elsewhere, mount a single `body()` with that path ([Combining Plugins](/guide/combining#body-cookie-and-query)).
