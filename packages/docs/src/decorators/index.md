---
title: Decorators
description: Class-, method-, and parameter-decorators for routup — define controllers in TypeScript and mount them on a router.
relatedPlugins: [basic, body, cookie, query, swagger, swagger-preset]
---

# @routup/decorators

Define request handlers as classes with TypeScript decorators, then mount them on any routup router. Familiar shape if you're coming from NestJS, tsoa, or Spring — controllers, parameter injection, declarative paths.

The decorator metadata is also what [`@routup/swagger`](/swagger/) reads (via [`@routup/swagger-preset`](/swagger-preset/)) to generate OpenAPI documents — so the same controller is both your routing surface and your API contract.

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
import { Router, serve } from 'routup';
import { decorators } from '@routup/decorators';
import { basic } from '@routup/basic';
import { UserController } from './controller';

const router = new Router();

router.use(basic());
router.use(decorators({
    controllers: [UserController],
}));

serve(router, { port: 3000 });
```

## When to use it

- You prefer class-based controllers to functional handler files
- You're generating OpenAPI from your controllers via [`@routup/swagger`](/swagger/)
- You're migrating a NestJS / tsoa / class-validator codebase and want a familiar shape

The plugin doesn't replace `defineCoreHandler` — it sits alongside it. You can mount decorator controllers and functional handlers on the same router.

## See also

- [Controllers](./controllers) — `@DController`, HTTP method decorators, async handlers, returning a `Response`
- [Parameters](./parameters) — every parameter decorator and the parser plugins it relies on
- [`@routup/swagger`](/swagger/) — generate OpenAPI from your decorated controllers
- [`@routup/swagger-preset`](/swagger-preset/) — the metadata preset that maps `@DController` / `@DGet` / `@DBody` to OpenAPI
