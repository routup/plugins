import type { BaseType, Example } from '@trapi/core';

/**
 * A response a `@DReturns`/`@DDescription` declares.
 */
export type ResponseIntent = {
    status: string,
    description: string,
    examples: Example[],
    schema?: BaseType,
};
