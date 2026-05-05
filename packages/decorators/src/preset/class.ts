import {
    type ControllerHandler,
    controller,
    setControllerPaths,
} from '@trapi/core';

const dControllerHandler = controller({
    match: { name: 'DController', on: 'class' },
    apply: (ctx, draft) => {
        setControllerPaths(draft, ctx.argument(0));
    },
});

export function buildClassHandlers(): ControllerHandler[] {
    return [dControllerHandler];
}
