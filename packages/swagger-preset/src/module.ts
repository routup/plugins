import type { DecoratorConfig } from '@trapi/swagger';
import { buildClassDecoratorConfig } from './class';
import { buildMethodDecoratorConfig } from './method';
import { buildParameterDecoratorConfig } from './parameter';
import { buildSwaggerDecoratorConfig } from './swagger';

export function buildDecoratorConfig() : DecoratorConfig[] {
    return [
        ...buildSwaggerDecoratorConfig(),
        ...buildMethodDecoratorConfig(),
        ...buildClassDecoratorConfig(),
        ...buildParameterDecoratorConfig(),
    ];
}
