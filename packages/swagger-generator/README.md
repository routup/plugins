# @routup/swagger-generator

[![npm version](https://badge.fury.io/js/@routup%2Fswagger-generator.svg)](https://badge.fury.io/js/@routup%2Fswagger-generator)
[![main](https://github.com/Tada5hi/routup/actions/workflows/main.yml/badge.svg)](https://github.com/Tada5hi/routup/actions/workflows/main.yml)
[![codecov](https://codecov.io/gh/tada5hi/routup/branch/master/graph/badge.svg?token=QFGCsHRUax)](https://codecov.io/gh/tada5hi/routup)
[![Known Vulnerabilities](https://snyk.io/test/github/Tada5hi/routup/badge.svg)](https://snyk.io/test/github/Tada5hi/routup)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-%23FE5196?logo=conventionalcommits&logoColor=white)](https://conventionalcommits.org)

Generate OpenAPI v2 / v3 documents from decorated routup controllers via [`@trapi/metadata`](https://github.com/trapi/trapi). Thin wrapper around `@trapi/swagger`'s `generateSwagger()` with routup-friendly defaults; the metadata preset that decodes `@D*` decorators lives in [`@routup/decorators/preset`](../decorators) and is applied by default. Pair with [`@routup/swagger-ui`](../swagger-ui) to serve the generated document.

## Installation

```bash
npm install @routup/swagger-generator
```

## Documentation

To read the docs, visit [https://routup.net](https://routup.net)

## Usage

`generateSwagger()` is a routup-flavored wrapper around `@trapi/swagger`'s `generateSwagger()`. It accepts the same `SwaggerGenerateOptions` shape (`{ version, metadata, data }`) with every field optional, applying defaults for `metadata.entryPoint`, `metadata.preset`, `version`, and a small `data` baseline.

**`V3`**

```typescript
import { generateSwagger, Version } from '@routup/swagger-generator';

const spec = await generateSwagger({
    version: Version.V3,
    data: {
        servers: ['http://localhost:3000/'],
    },
});
```

**`V2`**

```typescript
import { generateSwagger, Version } from '@routup/swagger-generator';

const spec = await generateSwagger({
    version: Version.V2,
    data: {
        servers: ['http://localhost:3000/'],
    },
});
```

`metadata` is optional — when omitted, the wrapper scans `<cwd>/src/**/*.ts` (ignoring `node_modules`) with the bundled preset. Override it only when you need a different scan root or pattern.

The default preset (`buildPreset()` from `@routup/decorators/preset`) is applied automatically when `metadata.preset` is omitted — set it explicitly only if you ship a customized variant. To persist the document, hand the returned spec to [`saveSwagger()`](https://www.npmjs.com/package/@trapi/swagger):

```typescript
import { saveSwagger } from '@routup/swagger-generator';

await saveSwagger(spec, { outputDirectory: 'writable' });
```

## Using the preset standalone

Other trapi-based tools (the `trapi` CLI, custom generators) can consume the preset directly without depending on `@routup/swagger-generator`:

```bash
npx trapi --preset @routup/decorators/preset
```

## License

Made with 💚

Published under [MIT License](./LICENSE).
