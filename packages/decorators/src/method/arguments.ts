import { useRequestParam, useRequestParams } from 'routup';
import { ParameterType } from '../parameter';
import type { DecoratorParameterOptions } from '../parameter';
import type { HandlerContext, ParameterExtractMap } from '../type';

export function buildDecoratorMethodArguments(
    context: HandlerContext,
    parameters: DecoratorParameterOptions[],
    extractMap?: ParameterExtractMap,
): any[] {
    /* istanbul ignore next */
    if (
        !Array.isArray(parameters) ||
        parameters.length === 0
    ) {
        return [context.request, context.response, context.next];
    }

    const items: unknown[] = [];

    for (let i = 0; i < parameters.length; i++) {
        const parameter = parameters[i];

        if (extractMap) {
            const extractFn = extractMap[parameter.type];
            if (extractFn) {
                if (parameter.property) {
                    items[parameter.index] = extractFn(context, parameter.property);
                } else {
                    items[parameter.index] = extractFn(context);
                }

                continue;
            }
        }

        if (parameter.type === ParameterType.REQUEST) {
            items[parameter.index] = context.request;
            continue;
        }

        if (parameter.type === ParameterType.RESPONSE) {
            items[parameter.index] = context.response;
            continue;
        }

        if (parameter.type === ParameterType.NEXT) {
            items[parameter.index] = context.next;
            continue;
        }

        if (parameter.type === ParameterType.PARAM) {
            if (parameter.property) {
                items[parameter.index] = useRequestParam(context.request, parameter.property);
            } else {
                items[parameter.index] = useRequestParams(context.request);
            }
            continue;
        }

        if (parameter.type === ParameterType.HEADER) {
            if (parameter.property) {
                items[parameter.index] = context.request.headers[parameter.property.toLowerCase()];
            } else {
                items[parameter.index] = context.request.headers;
            }
            continue;
        }

        throw new SyntaxError(`Parameter ${parameter.type} could not be extracted.`);
    }

    return items;
}
