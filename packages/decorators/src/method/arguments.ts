import { readRequestBody } from '@routup/body';
import { useRequestCookie, useRequestCookies } from '@routup/cookie';
import { useRequestQuery } from '@routup/query';
import { ParameterType } from '../parameter';
import type { DecoratorParameterOptions } from '../parameter';
import type { HandlerContext } from '../types';

export async function buildDecoratorMethodArguments(
    context: HandlerContext,
    parameters: DecoratorParameterOptions[],
): Promise<any[]> {
    /* istanbul ignore next */
    if (
        !Array.isArray(parameters) ||
        parameters.length === 0
    ) {
        return [context.event];
    }

    // The last declaration of an index wins (an override's after the
    // inherited one, the outer of two stacked decorators), and only its
    // extractor runs, so a shadowed one neither reads nor rejects the request.
    // Indexes are compared as property keys, as the assignment does, and the
    // winners run in list order.
    const last : Record<PropertyKey, number> = Object.create(null);

    for (const [position, parameter] of parameters.entries()) {
        last[parameter.index] = position;
    }

    const items: unknown[] = [];

    for (const [position, parameter] of parameters.entries()) {
        if (last[parameter.index] !== position) {
            continue;
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

        if (parameter.type === ParameterType.BODY) {
            items[parameter.index] = parameter.property ?
                await readRequestBody(context.event, parameter.property) :
                await readRequestBody(context.event);

            continue;
        }

        if (parameter.type === ParameterType.QUERY) {
            items[parameter.index] = parameter.property ?
                useRequestQuery(context.event, parameter.property) :
                useRequestQuery(context.event);

            continue;
        }

        if (parameter.type === ParameterType.COOKIE) {
            items[parameter.index] = parameter.property ?
                useRequestCookie(context.event, parameter.property) :
                useRequestCookies(context.event);

            continue;
        }

        throw new SyntaxError(`Parameter ${parameter.type} could not be extracted.`);
    }

    return items;
}
