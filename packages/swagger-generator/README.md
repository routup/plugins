# @routup/swagger-generator

[![npm version](https://badge.fury.io/js/@routup%2Fswagger-generator.svg)](https://badge.fury.io/js/@routup%2Fswagger-generator)
[![main](https://github.com/Tada5hi/routup/actions/workflows/main.yml/badge.svg)](https://github.com/Tada5hi/routup/actions/workflows/main.yml)
[![codecov](https://codecov.io/gh/tada5hi/routup/branch/master/graph/badge.svg?token=QFGCsHRUax)](https://codecov.io/gh/tada5hi/routup)
[![Known Vulnerabilities](https://snyk.io/test/github/Tada5hi/routup/badge.svg)](https://snyk.io/test/github/Tada5hi/routup)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-%23FE5196?logo=conventionalcommits&logoColor=white)](https://conventionalcommits.org)

Generate OpenAPI v2 / v3 documents from decorated routup controllers via [`@trapi/metadata`](https://github.com/trapi/trapi). Bundles the metadata preset that decodes routup's `@D*` decorators (`@DController`, `@DGet`, `@DBody`, …). Pair with [`@routup/swagger-ui`](../swagger-ui) to serve the generated document.

## Installation

```bash
npm install @routup/swagger-generator
```

## Documentation

To read the docs, visit [https://routup.net](https://routup.net)

## Usage

**`V3`**

```typescript
import { generate, Version } from '@routup/swagger-generator';
import process from 'node:process';

await generate({
    version: Version.V3,
    options: {
        metadata: {
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

The function call will save the file under the location: `./writable/swagger.json`.

**`V2`**

```typescript
import { generate, Version } from '@routup/swagger-generator';

await generate({
    version: Version.V2,
    options: {
        metadata: {
            entryPoint: { cwd: process.cwd(), pattern: '**/*.ts' },
        },
        output: true,
        outputDirectory: 'writable',
        servers: ['http://localhost:3000/'],
    },
});
```

The bundled preset (returned by `buildPreset()`) is applied automatically — set `preset:` explicitly only if you ship a customized variant.

## License

Made with 💚

Published under [MIT License](./LICENSE).
