# Changelog

## [5.2.0](https://github.com/routup/plugins/compare/i18n-v5.1.0...i18n-v5.2.0) (2026-11-25)


### Features

* fix bodiless DConsumes requests and adopt routup 6.5.0 features ([#889](https://github.com/routup/plugins/issues/889)) ([c836f8d](https://github.com/routup/plugins/commit/c836f8d14eca558d65306bb730dd2a1609540b70))

## [5.1.0](https://github.com/routup/plugins/compare/i18n-v5.0.1...i18n-v5.1.0) (2026-11-22)


### Features

* adopt routup 6.5.0 ([#884](https://github.com/routup/plugins/issues/884)) ([1553a5e](https://github.com/routup/plugins/commit/1553a5eebc26a0fbdc9358aa48ffd264f4de2a69))

## [5.0.1](https://github.com/routup/plugins/compare/i18n-v5.0.0...i18n-v5.0.1) (2026-11-15)


### Bug Fixes

* require routup ^6.3.0 and node &gt;=24 ([e3339a1](https://github.com/routup/plugins/commit/e3339a107396829e9cb32040d9b4367dd1be8b5f))
* ship README logo in package assets ([76aae10](https://github.com/routup/plugins/commit/76aae10d8636b92665e10ab84f3604343320754d))

## [5.0.0](https://github.com/routup/plugins/compare/i18n-v4.0.0...i18n-v5.0.0) (2026-11-08)


### ⚠ BREAKING CHANGES

* **i18n:** the ilingo peer dependency is now ^6.2.1. The translator context uses `namespace` instead of `group`, and plugin options only accept `store` and `locale`; pass an Ilingo instance for other ilingo options.

### Features

* **i18n:** upgrade to ilingo v6 ([c8bb6c5](https://github.com/routup/plugins/commit/c8bb6c5a4ef2fd8a4bf690135b348606c2c151a7))


### Bug Fixes

* **deps:** bump the minorandpatch group across 1 directory with 16 updates ([#851](https://github.com/routup/plugins/issues/851)) ([135bf8f](https://github.com/routup/plugins/commit/135bf8f14141992d7624654aa04fed7bdac70005))

## [4.0.0](https://github.com/routup/plugins/compare/i18n-v3.2.0...i18n-v4.0.0) (2026-05-20)


### ⚠ BREAKING CHANGES

* plugins now require routup ^6.0.0. v5 is no longer supported.
* requires routup ^6.0.0-beta.0. Public APIs that previously typed against `Router` / `IRouter` (e.g. decorators `mountController(router: IRouter, ...)`) now type against `App` / `IApp`.

### Features

* migrate plugins to routup v6.0.0-beta.0 ([b1cbc45](https://github.com/routup/plugins/commit/b1cbc45673b38d27ab489f08efff46f90e81a17c))
* pin to routup ^6.0.0 GA and drop App.clone() usage ([1042d71](https://github.com/routup/plugins/commit/1042d7194c21e3a6d155804038245e4c7f62d0c1))

## [3.2.0](https://github.com/routup/plugins/compare/i18n-v3.1.0...i18n-v3.2.0) (2026-05-12)


### Features

* **decorators:** support array of paths in @DController ([#801](https://github.com/routup/plugins/issues/801)) ([a45df32](https://github.com/routup/plugins/commit/a45df32e75512a1ef79b93a78cdd0b6fbf6505ba))

## [3.1.0](https://github.com/routup/plugins/compare/i18n-v3.0.0...i18n-v3.1.0) (2026-05-06)


### Features

* **logger:** release @routup/logger ([49c3cea](https://github.com/routup/plugins/commit/49c3cea36d93c0339a8a847a60ee35c6712bb3d2))


### Bug Fixes

* **deps:** bump the minorandpatch group across 1 directory with 3 updates ([#788](https://github.com/routup/plugins/issues/788)) ([fab6c09](https://github.com/routup/plugins/commit/fab6c09e535a8833ccb37f375c67bf6858371d0b))


### Reverts

* "feat(logger): release @routup/logger" ([7ecddbc](https://github.com/routup/plugins/commit/7ecddbc9a545abc6e26a724739053c5f8d2d75f8))

## [3.0.0](https://github.com/routup/plugins/compare/i18n-v2.0.2...i18n-v3.0.0) (2026-05-05)


### ⚠ BREAKING CHANGES

* **decorators:** bump routup to ^5.0.0 and migrate preset to @trapi… ([#787](https://github.com/routup/plugins/issues/787))

### Features

* **decorators:** bump routup to ^5.0.0 and migrate preset to [@trapi](https://github.com/trapi)… ([#787](https://github.com/routup/plugins/issues/787)) ([1f5d0f6](https://github.com/routup/plugins/commit/1f5d0f6fab61ea50c55393d1e5c70d50281719f5))
* **i18n:** update @routup/i18n for routup v5 ([#769](https://github.com/routup/plugins/issues/769)) ([872de6f](https://github.com/routup/plugins/commit/872de6fbdf7da268bb77d841d70e4192586c7766))
* modernize monorepo ([a5965ba](https://github.com/routup/plugins/commit/a5965baa51025e34e4a8bca52825b638392263cc))


### Bug Fixes

* align peer dependencies and add unit tests and docs ([c23f388](https://github.com/routup/plugins/commit/c23f3883b155c90fe112333f910ad1f455fcf031))

## [2.0.2](https://github.com/routup/plugins/compare/i18n-v2.0.1...i18n-v2.0.2) (2025-11-26)


### Bug Fixes

* **deps:** bump the minorandpatch group across 1 directory with 11 updates ([#709](https://github.com/routup/plugins/issues/709)) ([3611994](https://github.com/routup/plugins/commit/361199428ec05ccea05f5a4da5e0615e5d933bdf))

## [2.0.1](https://github.com/routup/plugins/compare/i18n-v2.0.0...i18n-v2.0.1) (2025-06-25)


### Bug Fixes

* **deps:** bump the minorandpatch group with 17 updates ([#699](https://github.com/routup/plugins/issues/699)) ([a2c0464](https://github.com/routup/plugins/commit/a2c046409faa89f3611f10b59369770c8ac6209f))

## [2.0.0](https://github.com/routup/plugins/compare/i18n-v1.0.0...i18n-v2.0.0) (2024-06-29)


### ⚠ BREAKING CHANGES

* public api changed

### Features

* bump routup from 3.3.0 to 4.0.0 ([#492](https://github.com/routup/plugins/issues/492)) ([80abffb](https://github.com/routup/plugins/commit/80abffb9aeb2a55bcc54e9b8a0598527fc7e6d02))
* translator arguments changed ([651b50d](https://github.com/routup/plugins/commit/651b50d6900309e029aa9b4dc0473702bdb8f494))

## 1.0.0 (2024-04-03)


### Features

* initial i18n plugin implementation ([#373](https://github.com/routup/plugins/issues/373)) ([c298e65](https://github.com/routup/plugins/commit/c298e65669c3c4aed0fe417690c6552e68f6f963))
