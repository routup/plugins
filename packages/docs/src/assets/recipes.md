---
title: Assets Recipes
description: Task-oriented samples for serving static files with @routup/assets.
relatedPlugins: []
---

# Recipes

The samples serve the folder `public/` next to the sample file; Serve Several Folders adds `legacy/`.

## Serve Several Folders

Register the plugin once per folder. A request without a file in the first folder goes on to the second.

<<< @/../examples/assets/several-folders.ts

```bash
curl http://localhost:3000/about
# <!doctype html> ... <h1>About</h1>
curl http://localhost:3000/old-page
# <!doctype html> ... <h1>Old Page</h1>
```

## Serve Under a Path Prefix

With a path, the plugin serves only requests under it and looks up the rest of the path in the folder. Requests outside the prefix reach the other routes.

<<< @/../examples/assets/path-prefix.ts

```bash
curl http://localhost:3000/static/about
# <!doctype html> ... <h1>About</h1>
curl http://localhost:3000/about
# {"page":"about"}
```

## Cache Hashed Files

Files with a content hash in the name can be cached for a year; the other files are revalidated with their ETag on every use.

<<< @/../examples/assets/cache-headers.ts

```bash
curl -I http://localhost:3000/assets/app.3f9a1c.css
# cache-control: public,max-age=31536000,immutable
curl -I http://localhost:3000/about
# cache-control: public,max-age=0,must-revalidate
```

## Answer Missing Files

`resolve` builds the response for a path without a file, here a JSON `404` instead of passing the request on.

<<< @/../examples/assets/missing-file.ts

```bash
curl -i http://localhost:3000/files/nope.txt
# HTTP/1.1 404 Not Found
# {"message":"/files/nope.txt not found"}
```

## Single-Page App

A single-page app gets its `index.html` for every path its client-side router handles, while missing assets and API paths do not: [`fallback`](/assets/configuration#fallback) with [`fallbackIgnores`](/assets/configuration#fallbackignores). The [Static Files](https://routup.dev/examples/static-files) example on routup.dev shows the setup next to API routes, with a tested sample.
