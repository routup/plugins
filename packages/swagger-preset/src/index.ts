import type { PresetSchema } from '@trapi/swagger';
import { buildDecoratorConfig } from './module';

export * from './module';

export default {
    extends: [],
    items: buildDecoratorConfig(),
} satisfies PresetSchema;
