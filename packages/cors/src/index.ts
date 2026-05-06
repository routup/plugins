import {
    cors,
} from './module';

export * from './handler';
export * from './module';
export * from './types';
export {
    isCorsOriginAllowed,
    isPreflightRequest,
    resolveOptions,
} from './utils';

export default cors;
