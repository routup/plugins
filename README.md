<div align="center">

[![Routup banner](./.github/assets/banner.png)](https://routup.net)

</div>

# Plugins 🔌

[![npm version](https://badge.fury.io/js/routup.svg)](https://badge.fury.io/js/routup)
[![main](https://github.com/Tada5hi/routup/actions/workflows/main.yml/badge.svg)](https://github.com/Tada5hi/routup/actions/workflows/main.yml)
[![codecov](https://codecov.io/gh/tada5hi/routup/branch/master/graph/badge.svg?token=CLIA667K6V)](https://codecov.io/gh/tada5hi/routup)
[![Known Vulnerabilities](https://snyk.io/test/github/Tada5hi/routup/badge.svg)](https://snyk.io/test/github/Tada5hi/routup)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-%23FE5196?logo=conventionalcommits&logoColor=white)](https://conventionalcommits.org)

This repository contains plugins for the Routup ecosystem. 

**Table of Contents**

- [Documentation](#documentation)
- [Plugins](#plugins)
- [Contributing](#contributing)
- [License](#license)

## Documentation

To read the docs, visit [https://routup.net](https://routup.net)

## Plugins

According to the fact that routup is a minimalistic framework, it depends on plugins to cover some 
typically http framework functions, which are not integrated in the main package.

| Name                                           | Description                                                            |
|------------------------------------------------|------------------------------------------------------------------------|
| [assets](packages/assets)                      | Serve static files from a directory.                                   |
| [body](packages/body)                          | Read and parse the request body.                                       |
| [cookie](packages/cookie)                      | Read and parse request cookies and serialize cookies for the response. |
| [decorators](packages/decorators)              | Create request handlers with class-, method- & parameter-decorators.   |
| [prometheus](packages/prometheus)              | Collect and serve metrics for prometheus.                              |
| [query](packages/query)                        | Read and parse the query string of the request url.                    |
| [rate-limit](packages/rate-limit)              | Rate limit incoming requests.                                          |
| [rate-limit-redis](packages/rate-limit-redis)  | Redis adapter for the rate-limit plugin.                               |
| [swagger](packages/swagger)                    | Serve generated docs from URL or based on a JSON file.                 |

## Contributing

Before starting to work on a pull request, it is important to review the guidelines for
[contributing](./CONTRIBUTING.md) and the [code of conduct](./CODE_OF_CONDUCT.md).
These guidelines will help to ensure that contributions are made effectively and are accepted.

## License

Made with 💚

Published under [MIT License](./LICENSE).
