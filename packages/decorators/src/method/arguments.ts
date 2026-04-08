import { ParameterType } from '../parameter';
import type { DecoratorParameterOptions } from '../parameter';
import type { HandlerContext, ParameterExtractMap } from '../type';

export async function buildDecoratorMethodArguments(
    context: HandlerContext,
    parameters: DecoratorParameterOptions[],
    extractMap?: ParameterExtractMap,
): Promise<any[]> {
    /* istanbul ignore next */
    if (
        !Array.isArray(parameters) ||
        parameters.length === 0
    ) {
        return [context.event];
    }

    const items: unknown[] = [];

    for (const parameter of parameters) {
        if (extractMap) {
            const extractFn = extractMap[parameter.type];
            if (extractFn) {
                if (parameter.property) {
                    items[parameter.index] = await extractFn(context, parameter.property);
                } else {
                    items[parameter.index] = await extractFn(context);
                }

                continue;
            }
        }

        if (parameter.type === ParameterType.CONTEXT) {
            items[parameter.index] = context.event;
            continue;
        }

        if (parameter.type === ParameterType.REQUEST) {
            items[parameter.index] = context.event.request;
            continue;
        }

        if (parameter.type === ParameterType.RESPONSE) {
            items[parameter.index] = context.event.response;
            continue;
        }

        if (parameter.type === ParameterType.NEXT) {
            items[parameter.index] = context.event.next;
            continue;
        }

        if (parameter.type === ParameterType.PARAM) {
            if (parameter.property) {
                items[parameter.index] = context.event.params[parameter.property];
            } else {
                items[parameter.index] = context.event.params;
            }
            continue;
        }

        if (parameter.type === ParameterType.HEADER) {
            if (parameter.property) {
                items[parameter.index] = context.event.headers.get(parameter.property.toLowerCase());
            } else {
                items[parameter.index] = context.event.headers;
            }
            continue;
        }

        throw new SyntaxError(`Parameter ${parameter.type} could not be extracted.`);
    }

    return items;
}
