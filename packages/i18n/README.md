# @routup/i18n

[![npm version](https://badge.fury.io/js/@routup%2Fcookie.svg)](https://badge.fury.io/js/@routup%2Fcookie)
[![main](https://github.com/Tada5hi/routup/actions/workflows/main.yml/badge.svg)](https://github.com/Tada5hi/routup/actions/workflows/main.yml)
[![codecov](https://codecov.io/gh/tada5hi/routup/branch/master/graph/badge.svg?token=QFGCsHRUax)](https://codecov.io/gh/tada5hi/routup)
[![Known Vulnerabilities](https://snyk.io/test/github/Tada5hi/routup/badge.svg)](https://snyk.io/test/github/Tada5hi/routup)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-%23FE5196?logo=conventionalcommits&logoColor=white)](https://conventionalcommits.org)

This is a plugin for translation and internationalization.

**Table of Contents**

- [Installation](#installation)
- [Documentation](#documentation)
- [Usage](#usage)
- [Types](#types)
- [Helpers](#helpers)
  - [useTranslator](#usetranslator)
- [License](#license)

## Installation

```bash
npm install @routup/i18n --save
```

## Documentation

To read the docs, visit [https://routup.net](https://routup.net)

## Usage

It is important to install the plugin, to enable locale detection and translator usage.

```typescript
import { createServer } from 'node:http';
import {
    createNodeDispatcher,
    coreHandler,
    Router
} from 'routup';
import {
    i18n,
    useTranslator
} from '@routup/i18n';

const router = new Router();

router.use(i18n({
    data: {
        de: {
            app: {
                key: 'Hallo, mein Name ist {{name}}',
            },
        },
        en: {
            app: {
                key: 'Hello, my name is {{name}}',
            },
        },
    },
}));

router.get('/', coreHandler((req, res) => {
    const translator = useTranslator(req);
    const translation = translator('app.key', { name: 'Peter' }); 
    console.log(translation);
    // Hallo, mein Name ist Peter
    
    return translation;
}));

const server = createServer(createNodeDispatcher(router));
server.listen(3000);
```

## Types


## Helpers

### `useTranslator`

This function returns a translator function to receive a translation for a given key.

```typescript
import { Request, Translator } from '@routup/i18n';

declare function useTranslator(
    req: Request
): Translator;
```

## License

Made with 💚

Published under [MIT License](./LICENSE).
