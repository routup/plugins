---
title: Decorators
description: Class-, method-, and parameter-decorators for routup — define controllers in TypeScript and mount them on a router.
relatedPlugins: [basic, body, cookie, query, swagger-ui]
---

# @routup/decorators

Define request handlers as classes with TypeScript decorators, then mount them on any routup router. Familiar shape if you're coming from NestJS, tsoa, or Spring — controllers, parameter injection, declarative paths.

The same decorator metadata also drives OpenAPI generation: this package ships a [TRAPI](https://github.com/trapi/trapi) preset under the `./preset` subpath, so the same controller serves as both your routing surface and your API contract. See [OpenAPI generation](#openapi-generation) below.

## Installation

```bash
npm install @routup/decorators
```

The plugin requires TypeScript decorator metadata. In your `tsconfig.json`:

```json
{
    "compilerOptions": {
        "experimentalDecorators": true,
        "emitDecoratorMetadata": true
    }
}
```

## Quick start

```typescript
// controller.ts
import { DController, DGet, DPath } from '@routup/decorators';

@DController('/users')
export class UserController {
    @DGet('')
    async list() {
        return [{ id: 1, name: 'Ada' }];
    }

    @DGet('/:id')
    async show(@DPath('id') id: string) {
        return { id: Number(id), name: 'Ada' };
    }
}
```

```typescript
// app.ts
import { App, serve } from 'routup';
import { decorators } from '@routup/decorators';
import { basic } from '@routup/basic';
import { UserController } from './controller';

const router = new App();

router.use(basic());
router.use(decorators({
    controllers: [UserController],
}));

serve(router, { port: 3000 });
```

## When to use it

- You prefer class-based controllers to functional handler files
- You want to generate OpenAPI documentation from the same controller definitions (see below)
- You're migrating a NestJS / tsoa / class-validator codebase and want a familiar shape

The plugin doesn't replace `defineCoreHandler` — it sits alongside it. You can mount decorator controllers and functional handlers on the same router.

## OpenAPI generation

`@routup/decorators` exposes a [TRAPI](https://github.com/trapi/trapi) preset under the `./preset` subpath that maps `@DController` / `@DGet` / `@DBody` / `@DQuery` / etc. into the schema TRAPI's generators consume. There is no dedicated `@routup/swagger-generator` package — extract metadata with `@trapi/metadata`, feed it into `@trapi/swagger`, or use the `trapi` CLI.

### Programmatically

`generateSwagger()` accepts pre-built metadata, so run `generateMetadata()` from `@trapi/metadata` first. The preset can be referenced by package specifier — `@trapi/metadata` resolves it through the `preset` export of `@routup/decorators/preset`:

```typescript
import { generateMetadata } from '@trapi/metadata';
import { generateSwagger, Version, saveSwagger } from '@trapi/swagger';
import process from 'node:process';
import path from 'node:path';

const metadata = await generateMetadata({
    preset: '@routup/decorators/preset',
    entryPoint: {
        cwd: path.join(process.cwd(), 'src'),
        pattern: '**/*.ts',
    },
    ignore: ['**/node_modules/**'],
});

const spec = await generateSwagger({
    version: Version.V3_2,
    metadata,
    data: {
        name: 'My API',
        servers: ['http://localhost:3000/'],
    },
});

await saveSwagger(spec, { outputDirectory: 'writable' });
```

To customise the preset before generation, import `buildPreset` from `@routup/decorators/preset` and pass the returned object as `preset` instead of the string identifier.

Hand the result to [`@routup/swagger-ui`](/swagger-ui/) to serve the document at runtime.

### Via the trapi CLI

```bash
npx trapi --preset @routup/decorators/preset
```

`@trapi/core` is declared as an *optional* peer dependency on `@routup/decorators`, so runtime-only consumers never pay for it. Install it (alongside `@trapi/metadata` and `@trapi/swagger`) only when you call into the generator.

## See also

- [Controllers](./controllers) — `@DController`, HTTP method decorators, async handlers, returning a `Response`
- [Parameters](./parameters) — every parameter decorator and the parser plugins it relies on
- [`@routup/swagger-ui`](/swagger-ui/) — serve the generated document with Swagger UI
- [`@trapi/swagger`](https://github.com/trapi/trapi) — the upstream OpenAPI generator the preset feeds into
