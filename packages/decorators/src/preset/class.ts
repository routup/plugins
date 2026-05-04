import {
    type ControllerHandler,
    controller,
    setControllerPaths,
} from '@trapi/metadata';

const dControllerHandler = controller({
    match: { name: 'DController', on: 'class' },
    apply: (ctx, draft) => {
        setControllerPaths(draft, ctx.argument(0));
    },
});

export function buildClassHandlers(): ControllerHandler[] {
    return [dControllerHandler];
}
