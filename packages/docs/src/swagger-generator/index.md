---
title: Swagger Generator
description: Generate an OpenAPI v2 or v3 document from your decorated controllers.
relatedPlugins: [decorators, swagger-ui]
---

# @routup/swagger-generator

`generate()` is a thin wrapper around [`@trapi/swagger`](https://github.com/trapi/trapi)'s `generateSwagger()` that applies routup-friendly defaults. The preset that decodes routup's `@D*` decorators lives in [`@routup/decorators/preset`](/decorators/) and is applied automatically when `metadata.preset` is omitted.

## Installation

```bash
npm install @routup/swagger-generator
```

## API

```typescript
generate<V extends `${Version}` = Version.V3_2>(
    options?: Partial<Omit<SwaggerGenerateOptions, 'version'>> & { version?: V },
): Promise<OutputForVersion<V>>;
```

The shape mirrors [`SwaggerGenerateOptions`](https://github.com/trapi/trapi/blob/main/packages/swagger/README.md): `{ version, metadata, data }`. Every field is optional — version defaults to `V3_2`, metadata gets a sensible default scan of `<cwd>/src/**/*.ts` plus the `@routup/decorators` preset, and `data` is merged onto a small `DEFAULT_DATA` (name, description, default `application/json` consumes/produces).

## OpenAPI v3

```typescript
import { generate, Version } from '@routup/swagger-generator';
import process from 'node:process';

const spec = await generate({
    version: Version.V3,
    metadata: {
        entryPoint: {
            cwd: process.cwd(),
            pattern: '**/*.ts',
        },
    },
    data: {
        servers: ['http://localhost:3000/'],
    },
});
```

## OpenAPI v2

```typescript
import { generate, Version } from '@routup/swagger-generator';

const spec = await generate({
    version: Version.V2,
    metadata: {
        entryPoint: { cwd: process.cwd(), pattern: '**/*.ts' },
    },
    data: {
        servers: ['http://localhost:3000/'],
    },
});
```

Same extraction logic, different document shape. Pick V3 unless you're integrating with a tool that hasn't moved past V2 (rare in 2026).

## Persisting the document

`generate()` returns the spec object. Hand it to `saveSwagger()` to write it to disk:

```typescript
import { generate, saveSwagger } from '@routup/swagger-generator';

const spec = await generate({ /* ... */ });
await saveSwagger(spec, { outputDirectory: 'writable' });
```

## Using the preset elsewhere

The preset is published as a subpath export of `@routup/decorators`. Tools like the `trapi` CLI can consume it directly:

```bash
npx trapi --preset @routup/decorators/preset
```

Or programmatically:

```typescript
import { buildPreset } from '@routup/decorators/preset';

const preset = buildPreset();
```

## When to run the generator

- **At build time** as part of CI, so the generated `swagger.json` ships with your build artifact
- **On startup** for development, so the UI reflects code changes without a rebuild

A common split: generate in CI, read in production; regenerate on watch in dev.

## See also

- [`@routup/swagger-ui`](/swagger-ui/) — serve the generated document via Swagger UI
- [`@routup/decorators`](/decorators/) — the decorators the preset decodes
