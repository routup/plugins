# Conventions

## Commits

**Conventional Commits** enforced via `commitlint` + `@tada5hi/commitlint-config`. Use `npm run commit` (git-cz) for interactive commit creation.

Format: `type(scope): description` — e.g., `fix(body): handle empty content-type header`

## Code Style

- **ESLint**: v10 with `@tada5hi/eslint-config` (flat config in `eslint.config.js`)
- **EditorConfig**: 4 spaces, LF line endings, UTF-8, trim trailing whitespace
- **TypeScript**: ES2022 target, bundler module resolution

```bash
npm run lint              # Lint all packages
npm run lint:fix          # Auto-fix
```

## Build

Each package builds with tsdown:

```bash
npm run build             # rimraf dist && tsdown
```

- **tsdown** for ESM-only output (`.mjs` + `.d.mts` with source maps)
- **NX** orchestrates build order across packages

## CI/CD (GitHub Actions)

| Workflow | Trigger | Steps |
|----------|---------|-------|
| `main.yml` | Push to develop/master/next/beta/alpha, PRs | Install → Build → Lint → Test |
| `release.yml` | Push to master | release-please → version bump → npm publish |

## Release

- **release-please** automates versioning and CHANGELOG generation
- **workspaces-publish** publishes all changed packages to npm
- Linked version groups: `rate-limit` + `rate-limit-redis`, `swagger` + `swagger-preset`

## Adding a New Plugin

1. Copy an existing package directory (e.g., `packages/query/`)
2. Update `package.json`: name (`@routup/[name]`), description, dependencies, ensure `"type": "module"`
3. Add `tsdown.config.ts` with entry pointing to `src/index.ts`
4. Add `test/vitest.config.ts`
5. Implement the plugin following the factory pattern in `module.ts`
6. Export plugin function + types from `src/index.ts`
7. Add tests in `test/unit/` with `import { describe, it, expect } from 'vitest'`
8. The package is auto-discovered by npm workspaces

## Helper Function Naming

Helper functions that interact with the request/response follow a consistent naming pattern:

| Prefix | When to use | Caches? | Example |
|--------|-------------|---------|---------|
| `use` | Returns cached data from `event.store` | yes | `useRequestBody(event)` |
| `read` | Reads/parses data (may cache raw bytes internally) | no* | `readRequestBodyText(event)` |
| `get` | Returns a value synchronously, no I/O | no | `getRequestHeader(event, name)` |
| `set` | Writes data to `event.store` or response | — | `setResponseCookie(event, ...)` |

\* `read` helpers may benefit from internal raw byte caching but re-derive the typed result each call.

The full pattern is: `<prefix>Request<Noun><Format?>` — e.g., `readRequestBodyBytes`, `useRequestCookies`, `setResponseCookie`.

Always include `Request` (or `Response`) in the name to stay consistent with routup core helpers.

## Git Hooks (Husky)

- **pre-commit**: Runs linting
- **commit-msg**: Validates conventional commit format
