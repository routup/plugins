import { buildPreset } from '@routup/decorators/preset';

// leave @DHeaders() parameters out of the document
export const preset = buildPreset();

preset.parameters = preset.parameters?.filter((handler) => handler.match.name !== 'DHeaders');
