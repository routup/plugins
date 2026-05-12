# Change Log

### Dependencies

* The following workspace dependencies were updated
  * devDependencies
    * @routup/query bumped from ^2.3.0 to ^2.3.1

## [4.2.0](https://github.com/routup/plugins/compare/decorators-v4.1.0...decorators-v4.2.0) (2026-05-12)


### Features

* **decorators:** support array of paths in @DController ([#801](https://github.com/routup/plugins/issues/801)) ([a45df32](https://github.com/routup/plugins/commit/a45df32e75512a1ef79b93a78cdd0b6fbf6505ba))


### Bug Fixes

* **deps:** bump the minorandpatch group across 1 directory with 8 updates ([#805](https://github.com/routup/plugins/issues/805)) ([392752f](https://github.com/routup/plugins/commit/392752f06d3b8499f7accc176aea965f41cf834d))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @routup/body bumped from ^3.1.0 to ^3.2.0
    * @routup/cookie bumped from ^3.1.0 to ^3.2.0
    * @routup/query bumped from ^3.1.0 to ^3.2.0

## [4.1.0](https://github.com/routup/plugins/compare/decorators-v4.0.0...decorators-v4.1.0) (2026-05-06)


### Features

* **logger:** release @routup/logger ([49c3cea](https://github.com/routup/plugins/commit/49c3cea36d93c0339a8a847a60ee35c6712bb3d2))


### Bug Fixes

* **deps:** bump the minorandpatch group across 1 directory with 3 updates ([#788](https://github.com/routup/plugins/issues/788)) ([fab6c09](https://github.com/routup/plugins/commit/fab6c09e535a8833ccb37f375c67bf6858371d0b))


### Reverts

* "feat(logger): release @routup/logger" ([7ecddbc](https://github.com/routup/plugins/commit/7ecddbc9a545abc6e26a724739053c5f8d2d75f8))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @routup/body bumped from ^3.0.0 to ^3.1.0
    * @routup/cookie bumped from ^3.0.0 to ^3.1.0
    * @routup/query bumped from ^3.0.0 to ^3.1.0

## [4.0.0](https://github.com/routup/plugins/compare/decorators-v3.4.3...decorators-v4.0.0) (2026-05-05)


### ⚠ BREAKING CHANGES

* **decorators:** bump routup to ^5.0.0 and migrate preset to @trapi… ([#787](https://github.com/routup/plugins/issues/787))
* **swagger-generator,decorators:** `@routup/swagger-generator` has been removed. Replace `import { generateSwagger } from '@routup/swagger-generator'` with `import { generateSwagger } from '@trapi/swagger'` plus `import { buildPreset } from '@routup/decorators/preset'`, and pass the preset explicitly via `metadata.preset`. See the "OpenAPI generation" section in `@routup/decorators`'s README.
* `@routup/swagger` is removed. Replace `import { generate, Version, buildPreset } from '@routup/swagger'` with `@routup/swagger-generator`, and `import { swaggerUI } from '@routup/swagger'` with `@routup/swagger-ui`. Install whichever halves you need.
* **decorators:** built-in body/cookie/query extractors and depend o… ([#781](https://github.com/routup/plugins/issues/781))

### Features

* **decorators:** built-in body/cookie/query extractors and depend o… ([#781](https://github.com/routup/plugins/issues/781)) ([90e0562](https://github.com/routup/plugins/commit/90e0562ce7374a0f0beae509f526c425b1e9f111))
* **decorators:** bump routup to ^5.0.0 and migrate preset to [@trapi](https://github.com/trapi)… ([#787](https://github.com/routup/plugins/issues/787)) ([1f5d0f6](https://github.com/routup/plugins/commit/1f5d0f6fab61ea50c55393d1e5c70d50281719f5))
* **decorators:** update @routup/decorators for routup v5 ([#764](https://github.com/routup/plugins/issues/764)) ([f72386f](https://github.com/routup/plugins/commit/f72386f2112497add6232a69913119f27a7d4feb))
* modernize monorepo ([a5965ba](https://github.com/routup/plugins/commit/a5965baa51025e34e4a8bca52825b638392263cc))
* split swagger package in ui, generator and move preset ([#783](https://github.com/routup/plugins/issues/783)) ([bd81c1c](https://github.com/routup/plugins/commit/bd81c1c849fd88ccc8498baebd2bf24b7de75f5c))
* **swagger-generator,decorators:** drop @routup/swagger-generator package ([#786](https://github.com/routup/plugins/issues/786)) ([7d96957](https://github.com/routup/plugins/commit/7d96957fb23daa111283e23c1078f536b599a47a))


### Bug Fixes

* **swagger:** align generator tests with v5 decorator changes ([2fe28b0](https://github.com/routup/plugins/commit/2fe28b058ce333041245082c419e51137711d6f2))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @routup/body bumped from ^2.4.3 to ^3.0.0
    * @routup/cookie bumped from ^2.4.3 to ^3.0.0
    * @routup/query bumped from ^2.4.3 to ^3.0.0

## [3.4.3](https://github.com/routup/plugins/compare/decorators-v3.4.2...decorators-v3.4.3) (2025-11-26)


### Bug Fixes

* **deps:** bump the minorandpatch group across 1 directory with 11 updates ([#709](https://github.com/routup/plugins/issues/709)) ([3611994](https://github.com/routup/plugins/commit/361199428ec05ccea05f5a4da5e0615e5d933bdf))


### Dependencies

* The following workspace dependencies were updated
  * devDependencies
    * @routup/body bumped from ^2.4.2 to ^2.4.3
    * @routup/cookie bumped from ^2.4.2 to ^2.4.3
    * @routup/query bumped from ^2.4.2 to ^2.4.3

## [3.4.2](https://github.com/routup/plugins/compare/decorators-v3.4.1...decorators-v3.4.2) (2025-06-25)


### Bug Fixes

* **deps:** bump the minorandpatch group with 17 updates ([#699](https://github.com/routup/plugins/issues/699)) ([a2c0464](https://github.com/routup/plugins/commit/a2c046409faa89f3611f10b59369770c8ac6209f))


### Dependencies

* The following workspace dependencies were updated
  * devDependencies
    * @routup/body bumped from ^2.4.1 to ^2.4.2
    * @routup/cookie bumped from ^2.4.1 to ^2.4.2
    * @routup/query bumped from ^2.4.1 to ^2.4.2

## [3.4.1](https://github.com/routup/plugins/compare/decorators-v3.4.0...decorators-v3.4.1) (2024-09-15)


### Dependencies

* The following workspace dependencies were updated
  * devDependencies
    * @routup/body bumped from ^2.4.0 to ^2.4.1
    * @routup/cookie bumped from ^2.4.0 to ^2.4.1
    * @routup/query bumped from ^2.4.0 to ^2.4.1

## [3.4.0](https://github.com/routup/plugins/compare/decorators-v3.3.2...decorators-v3.4.0) (2024-06-29)


### Features

* bump routup from 3.3.0 to 4.0.0 ([#492](https://github.com/routup/plugins/issues/492)) ([80abffb](https://github.com/routup/plugins/commit/80abffb9aeb2a55bcc54e9b8a0598527fc7e6d02))


### Dependencies

* The following workspace dependencies were updated
  * devDependencies
    * @routup/body bumped from ^2.3.0 to ^2.4.0
    * @routup/cookie bumped from ^2.3.1 to ^2.4.0
    * @routup/query bumped from ^2.3.2 to ^2.4.0

## [3.3.2](https://github.com/routup/plugins/compare/decorators-v3.3.1...decorators-v3.3.2) (2024-04-03)


### Dependencies

* The following workspace dependencies were updated
  * devDependencies
    * @routup/cookie bumped from ^2.3.0 to ^2.3.1
    * @routup/query bumped from ^2.3.1 to ^2.3.2

## 3.3.0

### Minor Changes

- [`86a9719`](https://github.com/routup/plugins/commit/86a9719618349eee2fdcfbdb9a8ba30f37ad3a6a) Thanks [@tada5hi](https://github.com/tada5hi)! - bump

## 3.2.0

### Minor Changes

- [`f1a6674`](https://github.com/routup/plugins/commit/f1a667403b032770bf2fe726ad85b3921d818245) Thanks [@tada5hi](https://github.com/tada5hi)! - bump minor version

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [3.1.0](https://github.com/routup/plugins/compare/@routup/decorators@3.0.0...@routup/decorators@3.1.0) (2023-10-22)

### Features

- bump routup to v3.1.0 ([a9f991b](https://github.com/routup/plugins/commit/a9f991b6a404e3b485d171fca21b7f3cf7e63ff5))

# 3.0.0 (2023-10-04)

**Note:** Version bump only for package @routup/decorators

# 3.0.0-alpha.3 (2023-10-04)

**Note:** Version bump only for package @routup/decorators

# 3.0.0-alpha.2 (2023-10-04)

**Note:** Version bump only for package @routup/decorators

# 3.0.0-alpha.1 (2023-10-04)

**Note:** Version bump only for package @routup/decorators

# [3.0.0-alpha.0](https://github.com/routup/plugins/compare/@routup/decorators@2.0.1...@routup/decorators@3.0.0-alpha.0) (2023-09-30)

### Features

- define & export plugin ([948cb96](https://github.com/routup/plugins/commit/948cb96621f5177aa4ac6db7f45292f5a38bac6d))
- modified packages for v3 compatibility ([2d1b17a](https://github.com/routup/plugins/commit/2d1b17aed26b5b0951086813716feccf9739a93e))
- move global helpers to the respective plugin ([2f50438](https://github.com/routup/plugins/commit/2f50438cea7a1e9d6d1573f5d21b9cf53361ee7c))

### BREAKING CHANGES

- packages not compatible to v1 and v2 anymore

## [2.0.1](https://github.com/routup/plugins/compare/@routup/decorators@2.0.0...@routup/decorators@2.0.1) (2023-09-14)

**Note:** Version bump only for package @routup/decorators

# [2.0.0](https://github.com/routup/plugins/compare/@routup/decorators@1.0.1...@routup/decorators@2.0.0) (2023-09-14)

### Bug Fixes

- **deps:** bump routup to v2.x ([b3be227](https://github.com/routup/plugins/commit/b3be227595d589153162d5f6dd7efb7a548675d0))

### Features

- adjusted handler generation ([b2b5d20](https://github.com/routup/plugins/commit/b2b5d205b13737129e3fde9a329b8b8ba494d2f5))

### BREAKING CHANGES

- processHandlerExecutionOutput removed

## [1.0.1](https://github.com/routup/plugins/compare/@routup/decorators@1.0.0...@routup/decorators@1.0.1) (2023-05-29)

**Note:** Version bump only for package @routup/decorators

# [1.0.0](https://github.com/routup/plugins/compare/@routup/decorators@1.0.0-alpha.0...@routup/decorators@1.0.0) (2023-05-15)

### Bug Fixes

- **deps:** bump routup to v1.0.0 ([5be242d](https://github.com/routup/plugins/commit/5be242d357918ca994b29236e285ea584a7a6ec8))

# [1.0.0-alpha.0](https://github.com/routup/plugins/compare/@routup/decorators@0.6.3...@routup/decorators@1.0.0-alpha.0) (2023-05-15)

### Bug Fixes

- bump routup + adjusted README.md of cookie, query and body plugin ([c2042c5](https://github.com/routup/plugins/commit/c2042c56e0ab64925a400e1b65177882d109f2c0))
- change dependency from core to routup package ([b3f203a](https://github.com/routup/plugins/commit/b3f203ac1a07190db6913620e620d8b930681e74))
- **deps,peer-deps:** bump routup dependencies ([f94914d](https://github.com/routup/plugins/commit/f94914d6926de73bed00c670e9447091e4144f35))

## [0.6.3](https://github.com/Tada5hi/routup/compare/@routup/decorators@0.6.2...@routup/decorators@0.6.3) (2023-05-11)

### Bug Fixes

- building decorator method arguments ([e1d7139](https://github.com/Tada5hi/routup/commit/e1d7139e0fd5d89ed7535d067681e118bc3e7a68))
- decorator parameter generation (return argument) ([71eb522](https://github.com/Tada5hi/routup/commit/71eb52285a642ff69d4bfa7afb703d11c0071418))

## [0.6.2](https://github.com/Tada5hi/routup/compare/@routup/decorators@0.6.1...@routup/decorators@0.6.2) (2023-03-13)

### Bug Fixes

- add additional type exports of trapi/swagger ([21e2973](https://github.com/Tada5hi/routup/commit/21e2973a27ab8cbb203f65b0f202d5a4e280a2bf))

## [0.6.1](https://github.com/Tada5hi/routup/compare/@routup/decorators@0.6.0...@routup/decorators@0.6.1) (2023-03-13)

### Bug Fixes

- add missing export for mixed decorators ([a944a56](https://github.com/Tada5hi/routup/commit/a944a564dc4894f213ad6a510bbd514935bbcfd4))

# [0.6.0](https://github.com/Tada5hi/routup/compare/@routup/decorators@0.5.2...@routup/decorators@0.6.0) (2023-03-13)

### Features

- add swagger generator for api endpoints ([c8ff8a7](https://github.com/Tada5hi/routup/commit/c8ff8a78c4e0e8b6399db567ce8b882bac2c1e83))

## [0.5.2](https://github.com/Tada5hi/routup/compare/@routup/decorators@0.5.1...@routup/decorators@0.5.2) (2023-03-01)

### Bug Fixes

- **deps:** bump peer-dependencies ([f353d3e](https://github.com/Tada5hi/routup/commit/f353d3e6e0c7f1752b66ba4c70302786e1216165))

## [0.5.1](https://github.com/Tada5hi/routup/compare/@routup/decorators@0.5.0...@routup/decorators@0.5.1) (2023-02-18)

**Note:** Version bump only for package @routup/decorators

# [0.5.0](https://github.com/Tada5hi/routup/compare/@routup/decorators@0.4.0...@routup/decorators@0.5.0) (2023-01-24)

### Features

- use rollup + swc for transpiling and bundle code for esm/cjs ([aeabf06](https://github.com/Tada5hi/routup/commit/aeabf06d2372f315bdbe33546ea5dacb74ce6d9d))

# [0.4.0](https://github.com/Tada5hi/routup/compare/@routup/decorators@0.3.0...@routup/decorators@0.4.0) (2023-01-16)

### Features

- replaced rollup,esbuild & ts-jest with swc ([eec4671](https://github.com/Tada5hi/routup/commit/eec46710781894532b9be0b0b9d1b911f0c7e937))

# [0.3.0](https://github.com/Tada5hi/routup/compare/@routup/decorators@0.2.0...@routup/decorators@0.3.0) (2023-01-16)

### Features

- create cjs & esm bundle ([5c13568](https://github.com/Tada5hi/routup/commit/5c135687d9dc6e7c38905d8e742029064454ab43))

# [0.2.0](https://github.com/Tada5hi/routup/compare/@routup/decorators@0.1.10...@routup/decorators@0.2.0) (2023-01-08)

### Features

- bump version ([4d3fce2](https://github.com/Tada5hi/routup/commit/4d3fce2941ce56fa86dc789b81021fffb4a5424c))

## [0.1.10](https://github.com/Tada5hi/routup/compare/@routup/decorators@0.1.9...@routup/decorators@0.1.10) (2023-01-05)

**Note:** Version bump only for package @routup/decorators

## [0.1.9](https://github.com/Tada5hi/routup/compare/@routup/decorators@0.1.8...@routup/decorators@0.1.9) (2022-12-21)

**Note:** Version bump only for package @routup/decorators

## [0.1.8](https://github.com/Tada5hi/routup/compare/@routup/decorators@0.1.7...@routup/decorators@0.1.8) (2022-12-20)

**Note:** Version bump only for package @routup/decorators

## [0.1.7](https://github.com/Tada5hi/routup/compare/@routup/decorators@0.1.6...@routup/decorators@0.1.7) (2022-12-20)

### Bug Fixes

- peer-dependency reference ([243552b](https://github.com/Tada5hi/routup/commit/243552b1e1982237fed259045fd88cfc565d9991))

## [0.1.6](https://github.com/Tada5hi/routup/compare/@routup/decorators@0.1.5...@routup/decorators@0.1.6) (2022-12-20)

**Note:** Version bump only for package @routup/decorators

## [0.1.5](https://github.com/Tada5hi/routup/compare/@routup/decorators@0.1.4...@routup/decorators@0.1.5) (2022-12-09)

### Bug Fixes

- **routup:** handle thrown route middleware error correctly ([43354cb](https://github.com/Tada5hi/routup/commit/43354cba99ff1c24f91f3d734e9c1b6170996532))

## [0.1.4](https://github.com/Tada5hi/routup/compare/@routup/decorators@0.1.3...@routup/decorators@0.1.4) (2022-12-04)

**Note:** Version bump only for package @routup/decorators

## [0.1.3](https://github.com/Tada5hi/routup/compare/@routup/decorators@0.1.2...@routup/decorators@0.1.3) (2022-11-26)

**Note:** Version bump only for package @routup/decorators

## [0.1.2](https://github.com/Tada5hi/routup/compare/@routup/decorators@0.1.1...@routup/decorators@0.1.2) (2022-11-21)

**Note:** Version bump only for package @routup/decorators

## [0.1.1](https://github.com/Tada5hi/routup/compare/@routup/decorators@0.1.0...@routup/decorators@0.1.1) (2022-11-21)

### Bug Fixes

- **decorators:** add missing exports ([fe571e1](https://github.com/Tada5hi/routup/commit/fe571e10e229c4dd33060a446d7b20c60ed30901))

# 0.1.0 (2022-11-21)

### Bug Fixes

- **decorators:** better naming for bounding controller(s) to a router instance ([5ab435d](https://github.com/Tada5hi/routup/commit/5ab435d1f6b18fe3ed9e0c660df565f6907a900b))

### Features

- new decorator(s) package/plugin ([511524c](https://github.com/Tada5hi/routup/commit/511524c854f5cdb7222b4cdea2a252a57c2007d1))
