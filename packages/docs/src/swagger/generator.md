---
title: Swagger — Generator
description: Generate an OpenAPI v2 or v3 document from your decorated controllers.
relatedPlugins: [decorators, swagger-preset]
---

# Generator

`generate()` runs the [`@trapi/metadata`](https://github.com/trapi/trapi) extractor over a TypeScript pattern, applies a preset (almost always [`@routup/swagger-preset`](/swagger-preset/)), and writes a Swagger / OpenAPI document.

## OpenAPI v3

```typescript
import { generate, Version } from '@routup/swagger';
import process from 'node:process';

await generate({
    version: Version.V3,
    options: {
        metadata: {
            preset: '@routup/swagger-preset',
            entryPoint: {
                cwd: process.cwd(),
                pattern: '**/*.ts',
            },
        },
        output: true,
        outputDirectory: 'writable',
        servers: ['http://localhost:3000/'],
    },
});
```

The output is written to `./writable/swagger.json`.

## OpenAPI v2

```typescript
import { generate, Version } from '@routup/swagger';

await generate({
    version: Version.V2,
    options: {
        metadata: {
            preset: '@routup/swagger-preset',
            entryPoint: { cwd: process.cwd(), pattern: '**/*.ts' },
        },
        output: true,
        outputDirectory: 'writable',
        servers: ['http://localhost:3000/'],
    },
});
```

Same extraction logic, different document shape. Pick V3 unless you're integrating with a tool that hasn't moved past V2 (rare in 2026).

## When to run the generator

- **At build time** as part of CI, so the generated `swagger.json` ships with your build artifact
- **On startup** for development, so the UI reflects code changes without a rebuild

A common split: generate in CI, read in production; regenerate on watch in dev.

## See also

- [UI](./ui) — serve the generated document via Swagger UI
- [`@routup/swagger-preset`](/swagger-preset/) — what `preset: '@routup/swagger-preset'` actually does
