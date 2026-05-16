# Changelog

## [2.0.0](https://github.com/routup/plugins/compare/logger-v1.1.0...logger-v2.0.0) (2026-05-16)


### ⚠ BREAKING CHANGES

* requires routup ^6.0.0-beta.0. Public APIs that previously typed against `Router` / `IRouter` (e.g. decorators `mountController(router: IRouter, ...)`) now type against `App` / `IApp`.

### Features

* migrate plugins to routup v6.0.0-beta.0 ([b1cbc45](https://github.com/routup/plugins/commit/b1cbc45673b38d27ab489f08efff46f90e81a17c))

## [1.1.0](https://github.com/routup/plugins/compare/logger-v1.0.0...logger-v1.1.0) (2026-05-12)


### Features

* **decorators:** support array of paths in @DController ([#801](https://github.com/routup/plugins/issues/801)) ([a45df32](https://github.com/routup/plugins/commit/a45df32e75512a1ef79b93a78cdd0b6fbf6505ba))

## 1.0.0 (2026-05-06)


### Features

* **logger:** release @routup/logger ([897a8d6](https://github.com/routup/plugins/commit/897a8d6b49b2f97f017d7eecaf5c4bc9dd27dacc))
* **logger:** release @routup/logger ([49c3cea](https://github.com/routup/plugins/commit/49c3cea36d93c0339a8a847a60ee35c6712bb3d2))


### Reverts

* "feat(logger): release @routup/logger" ([7ecddbc](https://github.com/routup/plugins/commit/7ecddbc9a545abc6e26a724739053c5f8d2d75f8))

## Change Log
