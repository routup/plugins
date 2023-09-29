import { useDecoratorMeta } from '../utils';
import { ParameterType } from './constants';

export function createParameterDecorator(
    type: `${ParameterType}`,
    property?: string,
) :ParameterDecorator {
    return (
        target: any,
        propertyKey: string | symbol | undefined,
        parameterIndex: number,
    ) => {
        /* istanbul ignore next */
        if (typeof propertyKey !== 'string') {
            return;
        }

        const meta = useDecoratorMeta(target);
        if (typeof meta.parameters[propertyKey] === 'undefined') {
            meta.parameters[propertyKey] = [];
        }

        meta.parameters[propertyKey].push({
            index: parameterIndex,
            property,
            type,
        });
    };
}

export function DRequest() : ParameterDecorator {
    return createParameterDecorator(ParameterType.REQUEST);
}

export function DResponse() : ParameterDecorator {
    return createParameterDecorator(ParameterType.RESPONSE);
}

export function DNext() : ParameterDecorator {
    return createParameterDecorator(ParameterType.NEXT);
}

// useRequestParams
export function DPaths() : ParameterDecorator {
    return createParameterDecorator(ParameterType.PARAM);
}

export function DPath(property: string) : ParameterDecorator {
    return createParameterDecorator(ParameterType.PARAM, property);
}

export function DHeaders() : ParameterDecorator {
    return createParameterDecorator(ParameterType.HEADER);
}

export function DHeader(property: string) : ParameterDecorator {
    return createParameterDecorator(ParameterType.HEADER, property);
}

export function DBody(property?: string) : ParameterDecorator {
    return createParameterDecorator(ParameterType.BODY, property);
}

export function DQuery(property?: string) : ParameterDecorator {
    return createParameterDecorator(ParameterType.QUERY, property);
}

export function DCookies() : ParameterDecorator {
    return createParameterDecorator(ParameterType.COOKIE);
}

export function DCookie(property: string) : ParameterDecorator {
    return createParameterDecorator(ParameterType.COOKIE, property);
}
