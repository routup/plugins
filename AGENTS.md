<!-- NOTE: Keep this file and all corresponding files in the .agents directory updated as the project evolves. When making architectural changes, adding new patterns, or discovering important conventions, update the relevant sections. -->

# routup plugins — Agent Guide

A monorepo of plugins for the [routup](https://github.com/tada5hi/routup) HTTP router framework. Each package under `packages/` is a self-contained npm package (`@routup/*`) that extends routup with middleware capabilities such as body parsing, cookies, rate limiting, Swagger UI, and more.

## Quick Reference

```bash
# Setup
npm ci

# Development
npm run build          # Build all packages (NX-orchestrated)
npm run test           # Run all tests with coverage
npm run lint           # ESLint across all packages
```

- **Node.js**: >=16 (CI uses v22)
- **Package manager**: npm (workspaces)
- **Monorepo orchestration**: NX

## Detailed Guides

- **[Project Structure](.agents/structure.md)** — Package layout, modules, and dependency layers
- **[Architecture](.agents/architecture.md)** — Plugin pattern, data flow, and key abstractions
- **[Testing](.agents/testing.md)** — Jest setup, conventions, and coverage
- **[Conventions](.agents/conventions.md)** — Code style, commits, CI/CD, and release
