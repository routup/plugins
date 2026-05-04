import type { Preset } from '@trapi/metadata';
import { buildClassHandlers } from './class';
import { buildMethodHandlers } from './method';
import { buildParameterHandlers } from './parameter';
import { buildSwaggerControllerHandlers, buildSwaggerMethodHandlers } from './swagger';

export function buildPreset(): Preset {
    return {
        name: '@routup/swagger',
        controllers: [
            ...buildClassHandlers(),
            ...buildSwaggerControllerHandlers(),
        ],
        methods: [
            ...buildMethodHandlers(),
            ...buildSwaggerMethodHandlers(),
        ],
        parameters: buildParameterHandlers(),
    };
}
