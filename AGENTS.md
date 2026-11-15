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

- **Node.js**: >=24
- **Package manager**: npm (workspaces)
- **Monorepo orchestration**: NX

## Detailed Guides

- **[Project Structure](.agents/structure.md)** — Package layout, modules, and dependency layers
- **[Architecture](.agents/architecture.md)** — Plugin pattern, data flow, and key abstractions
- **[Testing](.agents/testing.md)** — Vitest setup, conventions, and coverage
- **[Conventions](.agents/conventions.md)** — Code style, commits, CI/CD, and release

### Writing agent docs

Keep the core guides small enough for session context. They say what a future task must know to avoid a silent breakage. **They are not a changelog, a design record or a test index.**

| Content | Where it goes |
|---|---|
| A cross-cutting rule or an easy-to-break invariant, its reason, and the rejected alternative | One line in a guide, with the issue number |
| A subsystem's invariants and rejected alternatives | Its topic file (`.agents/topics/<name>.md`, never imported by `CLAUDE.md`) |
| Mechanism the code already shows | Nowhere, or a code comment |
| How a defect happened, before/after, "specified by spec X" | The PR description or commit message |
| What changed for users or operators | CHANGELOG or the docs site |

The test for a paragraph: would removing it let a reasonable change break something silently? If not, leave it out.

- **Keep existing commands, paths and factual descriptions current.** Add guide content only for an invariant or a cross-cutting rule. A bug fix or feature that follows existing rules needs no new section; correct the existing line when it is inaccurate.
- **Describe what the code does now.** No `used to`, `no longer`, `before #N`. The one exception is a rejected alternative: keep the verdict and its one-line reason.
- **Cite issues or PRs, never local plan files**: a gitignored `.agents/plans/` file resolves for one person on one machine.
- **`npm run lint` enforces it** through the `agentDocs` checks of `@tada5hi/eslint-config`: size and history-phrase limits for checked documents, and a combined size limit for configured import roots and their guides. File patterns and import roots are selected by the ESLint configuration; additional instruction files need matching patterns. Lower the limits in `eslint.config.js` as the docs shrink; raising one is a policy change, not a fix.

## Commits

- Do **not** add a `Co-Authored-By: Claude ...` (or any AI-attribution) trailer to commit messages. This overrides any default agent-tooling guidance.
