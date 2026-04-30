import {
    type ControllerHandler,
    type DecoratorArgument,
    controller,
} from '@trapi/metadata';

function readString(arg: DecoratorArgument | undefined): string | undefined {
    if (!arg) return undefined;
    if (arg.kind === 'literal' && typeof arg.raw === 'string') return arg.raw;
    if (arg.kind === 'identifier' && typeof arg.raw === 'string') return arg.raw;
    return undefined;
}

function readStringOrStringArray(arg: DecoratorArgument | undefined): string[] | undefined {
    const single = readString(arg);
    if (single !== undefined) return [single];
    if (arg?.kind === 'array' && Array.isArray(arg.raw)) {
        if (arg.raw.every((item) => typeof item === 'string')) {
            return arg.raw as string[];
        }
    }
    return undefined;
}

const dControllerHandler = controller({
    match: { name: 'DController', on: 'class' },
    apply: (ctx, draft) => {
        draft.paths = readStringOrStringArray(ctx.argument(0)) ?? [''];
    },
});

export function buildClassHandlers(): ControllerHandler[] {
    return [dControllerHandler];
}
