# Changelog

## [2.1.0](https://github.com/routup/plugins/compare/cors-v2.0.2...cors-v2.1.0) (2026-11-22)


### Features

* adopt routup 6.5.0 ([#884](https://github.com/routup/plugins/issues/884)) ([1553a5e](https://github.com/routup/plugins/commit/1553a5eebc26a0fbdc9358aa48ffd264f4de2a69))


### Bug Fixes

* **cors:** send vary: origin when the origin option depends on the request ([13d9c10](https://github.com/routup/plugins/commit/13d9c1087459bd680282e4024db5818c1a4ab3f2)), closes [#881](https://github.com/routup/plugins/issues/881)

## [2.0.2](https://github.com/routup/plugins/compare/cors-v2.0.1...cors-v2.0.2) (2026-11-15)


### Bug Fixes

* require routup ^6.3.0 and node &gt;=24 ([e3339a1](https://github.com/routup/plugins/commit/e3339a107396829e9cb32040d9b4367dd1be8b5f))
* ship README logo in package assets ([76aae10](https://github.com/routup/plugins/commit/76aae10d8636b92665e10ab84f3604343320754d))

## [2.0.1](https://github.com/routup/plugins/compare/cors-v2.0.0...cors-v2.0.1) (2026-11-08)


### Bug Fixes

* **deps:** bump the minorandpatch group across 1 directory with 16 updates ([#851](https://github.com/routup/plugins/issues/851)) ([135bf8f](https://github.com/routup/plugins/commit/135bf8f14141992d7624654aa04fed7bdac70005))

## [2.0.0](https://github.com/routup/plugins/compare/cors-v1.1.0...cors-v2.0.0) (2026-05-20)


### ⚠ BREAKING CHANGES

* plugins now require routup ^6.0.0. v5 is no longer supported.
* requires routup ^6.0.0-beta.0. Public APIs that previously typed against `Router` / `IRouter` (e.g. decorators `mountController(router: IRouter, ...)`) now type against `App` / `IApp`.

### Features

* migrate plugins to routup v6.0.0-beta.0 ([b1cbc45](https://github.com/routup/plugins/commit/b1cbc45673b38d27ab489f08efff46f90e81a17c))
* pin to routup ^6.0.0 GA and drop App.clone() usage ([1042d71](https://github.com/routup/plugins/commit/1042d7194c21e3a6d155804038245e4c7f62d0c1))

## [1.1.0](https://github.com/routup/plugins/compare/cors-v1.0.1...cors-v1.1.0) (2026-05-12)


### Features

* **decorators:** support array of paths in @DController ([#801](https://github.com/routup/plugins/issues/801)) ([a45df32](https://github.com/routup/plugins/commit/a45df32e75512a1ef79b93a78cdd0b6fbf6505ba))

## [1.0.1](https://github.com/routup/plugins/compare/cors-v1.0.0...cors-v1.0.1) (2026-05-07)


### Bug Fixes

* **cors:** resolve credentials + wildcard footguns ([03ab6ef](https://github.com/routup/plugins/commit/03ab6ef937a93ccf31ff16d48c6e6d2d21c571e8))

## 1.0.0 (2026-05-06)


### Features

* **logger:** release @routup/logger ([49c3cea](https://github.com/routup/plugins/commit/49c3cea36d93c0339a8a847a60ee35c6712bb3d2))


### Bug Fixes

* **deps:** bump the minorandpatch group across 1 directory with 3 updates ([#788](https://github.com/routup/plugins/issues/788)) ([fab6c09](https://github.com/routup/plugins/commit/fab6c09e535a8833ccb37f375c67bf6858371d0b))


### Reverts

* "feat(logger): release @routup/logger" ([7ecddbc](https://github.com/routup/plugins/commit/7ecddbc9a545abc6e26a724739053c5f8d2d75f8))

## Change Log
