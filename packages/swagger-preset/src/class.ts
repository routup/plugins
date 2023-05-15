import type { DecoratorConfig } from '@trapi/swagger';
import { DecoratorID } from '@trapi/swagger';

export function buildClassDecoratorConfig() : DecoratorConfig[] {
    return [
        {
            id: DecoratorID.CONTROLLER,
            name: 'DController',
            properties: {
                value: {},
            },
        },
        {
            id: DecoratorID.MOUNT,
            name: 'DController',
            properties: {
                value: {},
            },
        },
    ];
}
