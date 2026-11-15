import type { Preset } from '@trapi/core';
import { buildClassHandlers } from './class';
import { buildMethodHandlers } from './method';
import { buildParameterHandlers } from './parameter';
import { buildProducesControllerHandlers, buildProducesMethodHandlers } from './produces';
import { buildSwaggerControllerHandlers, buildSwaggerMethodHandlers } from './swagger';

export function buildPreset(): Preset {
    return {
        name: '@routup/decorators',
        controllers: [
            ...buildClassHandlers(),
            ...buildSwaggerControllerHandlers(),
            ...buildProducesControllerHandlers(),
        ],
        methods: [
            ...buildMethodHandlers(),
            ...buildSwaggerMethodHandlers(),
            ...buildProducesMethodHandlers(),
        ],
        parameters: buildParameterHandlers(),
    };
}
