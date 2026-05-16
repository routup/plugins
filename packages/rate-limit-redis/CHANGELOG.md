# Change Log

## [5.0.0](https://github.com/routup/plugins/compare/rate-limit-redis-v4.2.0...rate-limit-redis-v5.0.0) (2026-05-16)


### ⚠ BREAKING CHANGES

* requires routup ^6.0.0-beta.0. Public APIs that previously typed against `Router` / `IRouter` (e.g. decorators `mountController(router: IRouter, ...)`) now type against `App` / `IApp`.

### Features

* migrate plugins to routup v6.0.0-beta.0 ([b1cbc45](https://github.com/routup/plugins/commit/b1cbc45673b38d27ab489f08efff46f90e81a17c))


### Dependencies

* The following workspace dependencies were updated
  * devDependencies
    * @routup/rate-limit bumped from ^3.2.0 to ^4.0.0
  * peerDependencies
    * @routup/rate-limit bumped from ^3.2.0 to ^4.0.0

## [4.2.0](https://github.com/routup/plugins/compare/rate-limit-redis-v4.1.0...rate-limit-redis-v4.2.0) (2026-05-12)


### Features

* **decorators:** support array of paths in @DController ([#801](https://github.com/routup/plugins/issues/801)) ([a45df32](https://github.com/routup/plugins/commit/a45df32e75512a1ef79b93a78cdd0b6fbf6505ba))


### Dependencies

* The following workspace dependencies were updated
  * devDependencies
    * @routup/rate-limit bumped from ^3.1.0 to ^3.2.0
  * peerDependencies
    * @routup/rate-limit bumped from ^3.1.0 to ^3.2.0

## [4.1.0](https://github.com/routup/plugins/compare/rate-limit-redis-v4.0.0...rate-limit-redis-v4.1.0) (2026-05-06)


### Features

* **logger:** release @routup/logger ([49c3cea](https://github.com/routup/plugins/commit/49c3cea36d93c0339a8a847a60ee35c6712bb3d2))


### Bug Fixes

* **deps:** bump the minorandpatch group across 1 directory with 3 updates ([#788](https://github.com/routup/plugins/issues/788)) ([fab6c09](https://github.com/routup/plugins/commit/fab6c09e535a8833ccb37f375c67bf6858371d0b))


### Reverts

* "feat(logger): release @routup/logger" ([7ecddbc](https://github.com/routup/plugins/commit/7ecddbc9a545abc6e26a724739053c5f8d2d75f8))


### Dependencies

* The following workspace dependencies were updated
  * devDependencies
    * @routup/rate-limit bumped from ^3.0.0 to ^3.1.0
  * peerDependencies
    * @routup/rate-limit bumped from ^3.0.0 to ^3.1.0

## [4.0.0](https://github.com/routup/plugins/compare/rate-limit-redis-v3.1.2...rate-limit-redis-v4.0.0) (2026-05-05)


### ⚠ BREAKING CHANGES

* **decorators:** bump routup to ^5.0.0 and migrate preset to @trapi… ([#787](https://github.com/routup/plugins/issues/787))

### Features

* **decorators:** bump routup to ^5.0.0 and migrate preset to [@trapi](https://github.com/trapi)… ([#787](https://github.com/routup/plugins/issues/787)) ([1f5d0f6](https://github.com/routup/plugins/commit/1f5d0f6fab61ea50c55393d1e5c70d50281719f5))
* modernize monorepo ([a5965ba](https://github.com/routup/plugins/commit/a5965baa51025e34e4a8bca52825b638392263cc))
* **rate-limit:** update @routup/rate-limit for routup v5 ([#766](https://github.com/routup/plugins/issues/766)) ([75c40e3](https://github.com/routup/plugins/commit/75c40e3b7f2dbd69ead233814e5ad8644aac3a77))


### Bug Fixes

* align peer dependencies and add unit tests and docs ([c23f388](https://github.com/routup/plugins/commit/c23f3883b155c90fe112333f910ad1f455fcf031))


### Dependencies

* The following workspace dependencies were updated
  * devDependencies
    * @routup/rate-limit bumped from ^2.4.2 to ^3.0.0
  * peerDependencies
    * @routup/rate-limit bumped from ^2.4.2 to ^3.0.0

## [3.1.2](https://github.com/routup/plugins/compare/rate-limit-redis-v3.1.1...rate-limit-redis-v3.1.2) (2025-11-26)


### Bug Fixes

* **deps:** bump the minorandpatch group across 1 directory with 11 updates ([#709](https://github.com/routup/plugins/issues/709)) ([3611994](https://github.com/routup/plugins/commit/361199428ec05ccea05f5a4da5e0615e5d933bdf))


### Dependencies

* The following workspace dependencies were updated
  * devDependencies
    * @routup/rate-limit bumped from ^2.4.1 to ^2.4.2
  * peerDependencies
    * @routup/rate-limit bumped from ^2.4.1 to ^2.4.2

## [3.1.1](https://github.com/routup/plugins/compare/rate-limit-redis-v3.1.0...rate-limit-redis-v3.1.1) (2025-06-25)


### Bug Fixes

* **deps:** bump the minorandpatch group with 17 updates ([#699](https://github.com/routup/plugins/issues/699)) ([a2c0464](https://github.com/routup/plugins/commit/a2c046409faa89f3611f10b59369770c8ac6209f))


### Dependencies

* The following workspace dependencies were updated
  * devDependencies
    * @routup/rate-limit bumped from ^2.4.0 to ^2.4.1
  * peerDependencies
    * @routup/rate-limit bumped from ^2.4.0 to ^2.4.1

## [3.1.0](https://github.com/routup/plugins/compare/rate-limit-redis-v3.0.0...rate-limit-redis-v3.1.0) (2024-06-29)


### Features

* bump routup from 3.3.0 to 4.0.0 ([#492](https://github.com/routup/plugins/issues/492)) ([80abffb](https://github.com/routup/plugins/commit/80abffb9aeb2a55bcc54e9b8a0598527fc7e6d02))


### Dependencies

* The following workspace dependencies were updated
  * devDependencies
    * @routup/rate-limit bumped from ^2.3.0 to ^2.4.0
  * peerDependencies
    * @routup/rate-limit bumped from ^2.3.0 to ^2.4.0

## 3.0.0

### Minor Changes

- [`86a9719`](https://github.com/routup/plugins/commit/86a9719618349eee2fdcfbdb9a8ba30f37ad3a6a) Thanks [@tada5hi](https://github.com/tada5hi)! - bump

### Patch Changes

- Updated dependencies [[`86a9719`](https://github.com/routup/plugins/commit/86a9719618349eee2fdcfbdb9a8ba30f37ad3a6a)]:
  - @routup/rate-limit@2.3.0

## 2.2.0

### Minor Changes

- [`f1a6674`](https://github.com/routup/plugins/commit/f1a667403b032770bf2fe726ad85b3921d818245) Thanks [@tada5hi](https://github.com/tada5hi)! - bump minor version

### Patch Changes

- Updated dependencies [[`f1a6674`](https://github.com/routup/plugins/commit/f1a667403b032770bf2fe726ad85b3921d818245)]:
  - @routup/rate-limit@2.2.0

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [2.1.0](https://github.com/routup/plugins/compare/@routup/rate-limit-redis@2.0.0...@routup/rate-limit-redis@2.1.0) (2023-10-22)

### Features

- bump routup to v3.1.0 ([a9f991b](https://github.com/routup/plugins/commit/a9f991b6a404e3b485d171fca21b7f3cf7e63ff5))

# 2.0.0 (2023-10-04)

**Note:** Version bump only for package @routup/rate-limit-redis

# 2.0.0-alpha.3 (2023-10-04)

**Note:** Version bump only for package @routup/rate-limit-redis

# 2.0.0-alpha.2 (2023-10-04)

**Note:** Version bump only for package @routup/rate-limit-redis

# 2.0.0-alpha.1 (2023-10-04)

**Note:** Version bump only for package @routup/rate-limit-redis

# [2.0.0-alpha.0](https://github.com/routup/plugins/compare/@routup/rate-limit-redis@1.0.2...@routup/rate-limit-redis@2.0.0-alpha.0) (2023-09-30)

### Features

- define & export plugin ([948cb96](https://github.com/routup/plugins/commit/948cb96621f5177aa4ac6db7f45292f5a38bac6d))
- modified packages for v3 compatibility ([2d1b17a](https://github.com/routup/plugins/commit/2d1b17aed26b5b0951086813716feccf9739a93e))
- move global helpers to the respective plugin ([2f50438](https://github.com/routup/plugins/commit/2f50438cea7a1e9d6d1573f5d21b9cf53361ee7c))

### BREAKING CHANGES

- packages not compatible to v1 and v2 anymore

## [1.0.2](https://github.com/routup/plugins/compare/@routup/rate-limit-redis@1.0.1...@routup/rate-limit-redis@1.0.2) (2023-09-14)

### Bug Fixes

- **deps:** bump routup to v2.x ([b3be227](https://github.com/routup/plugins/commit/b3be227595d589153162d5f6dd7efb7a548675d0))

## [1.0.1](https://github.com/routup/plugins/compare/@routup/rate-limit-redis@1.0.0...@routup/rate-limit-redis@1.0.1) (2023-05-29)

**Note:** Version bump only for package @routup/rate-limit-redis

# [1.0.0](https://github.com/routup/plugins/compare/@routup/rate-limit-redis@1.0.0-alpha.0...@routup/rate-limit-redis@1.0.0) (2023-05-15)

### Bug Fixes

- **deps:** bump routup to v1.0.0 ([5be242d](https://github.com/routup/plugins/commit/5be242d357918ca994b29236e285ea584a7a6ec8))

# [1.0.0-alpha.0](https://github.com/routup/plugins/compare/@routup/rate-limit-redis@0.1.4...@routup/rate-limit-redis@1.0.0-alpha.0) (2023-05-15)

### Bug Fixes

- bump routup + adjusted README.md of cookie, query and body plugin ([c2042c5](https://github.com/routup/plugins/commit/c2042c56e0ab64925a400e1b65177882d109f2c0))
- change dependency from core to routup package ([b3f203a](https://github.com/routup/plugins/commit/b3f203ac1a07190db6913620e620d8b930681e74))
- **deps,peer-deps:** bump routup dependencies ([f94914d](https://github.com/routup/plugins/commit/f94914d6926de73bed00c670e9447091e4144f35))

## [0.1.4](https://github.com/Tada5hi/routup/compare/@routup/rate-limit-redis@0.1.3...@routup/rate-limit-redis@0.1.4) (2023-05-11)

**Note:** Version bump only for package @routup/rate-limit-redis

## [0.1.3](https://github.com/Tada5hi/routup/compare/@routup/rate-limit-redis@0.1.2...@routup/rate-limit-redis@0.1.3) (2023-03-13)

**Note:** Version bump only for package @routup/rate-limit-redis

## [0.1.2](https://github.com/Tada5hi/routup/compare/@routup/rate-limit-redis@0.1.1...@routup/rate-limit-redis@0.1.2) (2023-03-01)

### Bug Fixes

- **deps:** bump peer-dependencies ([f353d3e](https://github.com/Tada5hi/routup/commit/f353d3e6e0c7f1752b66ba4c70302786e1216165))

## [0.1.1](https://github.com/Tada5hi/routup/compare/@routup/rate-limit-redis@0.1.0...@routup/rate-limit-redis@0.1.1) (2023-02-18)

**Note:** Version bump only for package @routup/rate-limit-redis

# 0.1.0 (2023-01-24)

### Features

- **rate-limit-redis:** initial release ([5442233](https://github.com/Tada5hi/routup/commit/5442233bfe9ff40419a0b281b934549bb6cc945d))
