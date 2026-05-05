# Changelog

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
