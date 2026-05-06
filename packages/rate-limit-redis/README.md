# @routup/rate-limit-redis

[![npm version](https://badge.fury.io/js/@routup%2Frate-limit-redis.svg)](https://badge.fury.io/js/@routup%2Frate-limit-redis)
[![main](https://github.com/routup/plugins/actions/workflows/main.yml/badge.svg)](https://github.com/routup/plugins/actions/workflows/main.yml)
[![codecov](https://codecov.io/gh/routup/plugins/branch/master/graph/badge.svg)](https://codecov.io/gh/routup/plugins)
[![Known Vulnerabilities](https://snyk.io/test/github/routup/plugins/badge.svg)](https://snyk.io/test/github/routup/plugins)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-%23FE5196?logo=conventionalcommits&logoColor=white)](https://conventionalcommits.org)

This is a redis adapter for the rate-limit plugin.

**Table of Contents**

- [Installation](#installation)
- [Documentation](#documentation)
- [Usage](#usage)
- [License](#license)

## Installation

```bash
npm install @routup/rate-limit-redis --save
```

## Documentation

To read the docs, visit [https://routup.net](https://routup.net)

## Usage

```typescript
import {
    Router,
    serve,
} from 'routup';
import { rateLimit } from '@routup/rate-limit';
import { RedisStore } from '@routup/rate-limit-redis';

const router = new Router();

// Apply the rate limiting middleware to API calls only
router.use('/api', rateLimit({
    // 15 minutes
    windowMs: 15 * 60 * 1000,

    // Limit each IP to 100 requests
    // per `window` (here, per 15 minutes)
    max: 100,

    // connection string or ioredis instance 
    // can be passed optional as argument 
    store: new RedisStore(),
}));

serve(router, { port: 3000 });
```

## License

Made with 💚

Published under [MIT License](./LICENSE).

This library is heavily inspired by
[express-rate-limit-redis](https://www.npmjs.com/package/express-rate-limit-redis).
