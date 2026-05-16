# @routup/swagger-ui

[![npm version](https://badge.fury.io/js/@routup%2Fswagger-ui.svg)](https://badge.fury.io/js/@routup%2Fswagger-ui)
[![main](https://github.com/routup/plugins/actions/workflows/main.yml/badge.svg)](https://github.com/routup/plugins/actions/workflows/main.yml)
[![codecov](https://codecov.io/gh/routup/plugins/branch/master/graph/badge.svg)](https://codecov.io/gh/routup/plugins)
[![Known Vulnerabilities](https://snyk.io/test/github/routup/plugins/badge.svg)](https://snyk.io/test/github/routup/plugins)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-%23FE5196?logo=conventionalcommits&logoColor=white)](https://conventionalcommits.org)

Mount [Swagger UI](https://www.npmjs.com/package/swagger-ui-dist) on a routup `App` to serve an OpenAPI document interactively. To *produce* the document from decorated controllers, see the [`@routup/decorators` OpenAPI generation docs](../decorators#openapi-generation) — the preset feeds straight into [`@trapi/swagger`](https://github.com/trapi/trapi)'s `generateSwagger()`.

## Installation

```bash
npm install @routup/swagger-ui
```

## Documentation

To read the docs, visit [https://routup.net](https://routup.net)

## Usage

```typescript
import { App, serve } from 'routup';
import { swaggerUI } from '@routup/swagger-ui';

const router = new App();

router.use('/docs', swaggerUI('./openapi.json'));

serve(router, { port: 3000 });
```

Open `http://localhost:3000/docs/` in a browser.

You can also pass a parsed spec object or a remote URL:

```typescript
router.use('/docs', swaggerUI({ openapi: '3.0.0', /* ... */ }));
router.use('/docs', swaggerUI('https://petstore3.swagger.io/api/v3/openapi.json'));
```

## License

Made with 💚

Published under [MIT License](./LICENSE).
