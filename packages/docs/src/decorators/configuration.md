---
title: Decorators Configuration
description: The options of the decorators plugin.
relatedPlugins: [body, cookie, query]
---

# Configuration

`decorators(options)` takes one option, the controllers to mount. Register the plugin with `app.use()`, with or without a path ([Plugins](https://routup.dev/guide/plugins)).

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `controllers` | `(ClassType \| Record<string, any>)[]` | required | Controller classes, or controller instances, to mount when the plugin is installed |

### `controllers`

- **A class** is created once per install with `new Controller()`, without constructor arguments. There is no dependency injection.
- **An instance** is used as it is: pass one when the controller needs constructor arguments, as in `controllers: [new TodoController(repository)]` ([CRUD recipe](/decorators/recipes#a-crud-controller)).
- Each controller's routes are added under each of its `@DController()` paths, in the order of the array, at the position of `app.use()`. A controller and functional handlers can share the app.
- A class or instance without any decorator adds nothing.
