# Changelog

## [5.1.1](https://github.com/routup/plugins/compare/swagger-ui-v5.1.0...swagger-ui-v5.1.1) (2026-11-15)


### Bug Fixes

* **swagger-ui:** close worker-src in the recommended policy ([#867](https://github.com/routup/plugins/issues/867)) ([d22e5f3](https://github.com/routup/plugins/commit/d22e5f30dec2f59209c8564cabb3be9988cd2548))

## [5.1.0](https://github.com/routup/plugins/compare/swagger-ui-v5.0.0...swagger-ui-v5.1.0) (2026-11-15)


### Features

* **swagger-ui:** tighten the recommended content security policy ([#865](https://github.com/routup/plugins/issues/865)) ([aa49d45](https://github.com/routup/plugins/commit/aa49d457b0f227bcbb24b9c44db6455e3d1d0876))

## [5.0.0](https://github.com/routup/plugins/compare/swagger-ui-v4.0.2...swagger-ui-v5.0.0) (2026-11-15)


### ⚠ BREAKING CHANGES

* **rate-limit-redis:** @routup/rate-limit-redis requires redis-extension ^3 (ioredis ^6, Node.js >=24). redis-extension dropped its shared default client (setClient/useClient); pass the client to the RedisStore constructor instead.
* **swagger-ui:** Only GET and HEAD are answered. Paths other than the shell and the allowlisted files are passed to the next handler instead of answering the shell or a swagger-ui-dist file. The ?url= query is ignored. The default layout is BaseLayout; an explicit layout: 'StandaloneLayout' shows the top bar, which was hidden by CSS before. The options object passed to swaggerUI() is not modified. An invalid baseURL or a function option that cannot be serialized throws at setup.

### Features

* **rate-limit-redis:** adopt redis-extension 3 and bump dependencies ([4112fa6](https://github.com/routup/plugins/commit/4112fa6a1ab0227faded0abd81eb69d9e99926a3))
* **swagger-ui:** harden served files and bootstrap, add csp option ([#860](https://github.com/routup/plugins/issues/860)) ([82cd7ba](https://github.com/routup/plugins/commit/82cd7ba7dbd2da7ea4d8dfa83d9f22fab9d6f97a))


### Bug Fixes

* require routup ^6.3.0 and node &gt;=24 ([e3339a1](https://github.com/routup/plugins/commit/e3339a107396829e9cb32040d9b4367dd1be8b5f))
* ship README logo in package assets ([76aae10](https://github.com/routup/plugins/commit/76aae10d8636b92665e10ab84f3604343320754d))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @routup/assets bumped from ^5.0.1 to ^6.0.0

## [4.0.2](https://github.com/routup/plugins/compare/swagger-ui-v4.0.1...swagger-ui-v4.0.2) (2026-11-08)


### Bug Fixes

* **deps:** bump the minorandpatch group across 1 directory with 16 updates ([#851](https://github.com/routup/plugins/issues/851)) ([135bf8f](https://github.com/routup/plugins/commit/135bf8f14141992d7624654aa04fed7bdac70005))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @routup/assets bumped from ^5.0.0 to ^5.0.1

## [4.0.1](https://github.com/routup/plugins/compare/swagger-ui-v4.0.0...swagger-ui-v4.0.1) (2026-10-13)


### Bug Fixes

* **deps:** bump the minorandpatch group across 1 directory with 16 updates ([#828](https://github.com/routup/plugins/issues/828)) ([f737794](https://github.com/routup/plugins/commit/f7377946317099ad5915f8fb858525be780fff4c))

## [4.0.0](https://github.com/routup/plugins/compare/swagger-ui-v3.2.0...swagger-ui-v4.0.0) (2026-05-20)


### ⚠ BREAKING CHANGES

* plugins now require routup ^6.0.0. v5 is no longer supported.
* requires routup ^6.0.0-beta.0. Public APIs that previously typed against `Router` / `IRouter` (e.g. decorators `mountController(router: IRouter, ...)`) now type against `App` / `IApp`.

### Features

* migrate plugins to routup v6.0.0-beta.0 ([b1cbc45](https://github.com/routup/plugins/commit/b1cbc45673b38d27ab489f08efff46f90e81a17c))
* pin to routup ^6.0.0 GA and drop App.clone() usage ([1042d71](https://github.com/routup/plugins/commit/1042d7194c21e3a6d155804038245e4c7f62d0c1))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @routup/assets bumped from ^4.2.0 to ^5.0.0

## [3.2.0](https://github.com/routup/plugins/compare/swagger-ui-v3.1.0...swagger-ui-v3.2.0) (2026-05-12)


### Features

* **decorators:** support array of paths in @DController ([#801](https://github.com/routup/plugins/issues/801)) ([a45df32](https://github.com/routup/plugins/commit/a45df32e75512a1ef79b93a78cdd0b6fbf6505ba))


### Bug Fixes

* **deps:** bump the minorandpatch group across 1 directory with 8 updates ([#805](https://github.com/routup/plugins/issues/805)) ([392752f](https://github.com/routup/plugins/commit/392752f06d3b8499f7accc176aea965f41cf834d))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @routup/assets bumped from ^4.1.0 to ^4.2.0

## [3.1.0](https://github.com/routup/plugins/compare/swagger-ui-v3.0.0...swagger-ui-v3.1.0) (2026-05-06)


### Features

* **logger:** release @routup/logger ([49c3cea](https://github.com/routup/plugins/commit/49c3cea36d93c0339a8a847a60ee35c6712bb3d2))


### Bug Fixes

* **deps:** bump the minorandpatch group across 1 directory with 3 updates ([#788](https://github.com/routup/plugins/issues/788)) ([fab6c09](https://github.com/routup/plugins/commit/fab6c09e535a8833ccb37f375c67bf6858371d0b))


### Reverts

* "feat(logger): release @routup/logger" ([7ecddbc](https://github.com/routup/plugins/commit/7ecddbc9a545abc6e26a724739053c5f8d2d75f8))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @routup/assets bumped from ^4.0.0 to ^4.1.0

## [3.0.0](https://github.com/routup/plugins/compare/swagger-ui-v2.4.3...swagger-ui-v3.0.0) (2026-05-05)


### ⚠ BREAKING CHANGES

* **decorators:** bump routup to ^5.0.0 and migrate preset to @trapi… ([#787](https://github.com/routup/plugins/issues/787))
* **swagger-generator,decorators:** `@routup/swagger-generator` has been removed. Replace `import { generateSwagger } from '@routup/swagger-generator'` with `import { generateSwagger } from '@trapi/swagger'` plus `import { buildPreset } from '@routup/decorators/preset'`, and pass the preset explicitly via `metadata.preset`. See the "OpenAPI generation" section in `@routup/decorators`'s README.
* `@routup/swagger` is removed. Replace `import { generate, Version, buildPreset } from '@routup/swagger'` with `@routup/swagger-generator`, and `import { swaggerUI } from '@routup/swagger'` with `@routup/swagger-ui`. Install whichever halves you need.

### Features

* **decorators:** bump routup to ^5.0.0 and migrate preset to [@trapi](https://github.com/trapi)… ([#787](https://github.com/routup/plugins/issues/787)) ([1f5d0f6](https://github.com/routup/plugins/commit/1f5d0f6fab61ea50c55393d1e5c70d50281719f5))
* split swagger package in ui, generator and move preset ([#783](https://github.com/routup/plugins/issues/783)) ([bd81c1c](https://github.com/routup/plugins/commit/bd81c1c849fd88ccc8498baebd2bf24b7de75f5c))
* **swagger-generator,decorators:** drop @routup/swagger-generator package ([#786](https://github.com/routup/plugins/issues/786)) ([7d96957](https://github.com/routup/plugins/commit/7d96957fb23daa111283e23c1078f536b599a47a))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @routup/assets bumped from ^3.4.2 to ^4.0.0
