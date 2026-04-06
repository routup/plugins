# Conventions

## Commits

**Conventional Commits** enforced via `commitlint` + `@tada5hi/commitlint-config`. Use `npm run commit` (git-cz) for interactive commit creation.

Format: `type(scope): description` — e.g., `fix(body): handle empty content-type header`

## Code Style

- **ESLint**: v8.57 with `@tada5hi/eslint-config-typescript`
- **EditorConfig**: 4 spaces, LF line endings, UTF-8, trim trailing whitespace
- **TypeScript**: Strict mode, ES2020 target, experimental decorators enabled

```bash
npm run lint              # Lint all packages
```

## Build

Each package builds identically:

```bash
npm run build             # rimraf dist && rollup -c && tsc --emitDeclarationOnly
```

- **Rollup + SWC** for JS output (dual ESM/CJS with source maps)
- **tsc** for declaration files only
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
2. Update `package.json`: name (`@routup/[name]`), description, dependencies
3. Implement the plugin following the factory pattern in `module.ts`
4. Export plugin function + types from `src/index.ts`
5. Add tests in `test/unit/`
6. The package is auto-discovered by npm workspaces

## Git Hooks (Husky)

- **pre-commit**: Runs linting
- **commit-msg**: Validates conventional commit format
