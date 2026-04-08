import { createError } from 'routup';

/**
 * Map from content-encoding header values to DecompressionStream format names.
 */
const ENCODING_MAP: Record<string, string> = {
    gzip: 'gzip',
    deflate: 'deflate',
    'deflate-raw': 'deflate-raw',
    br: 'brotli',
};

export function createDecompressor(encoding: string): DecompressionStream {
    const format = ENCODING_MAP[encoding];

    if (!format) {
        throw createError({
            statusCode: 415,
            statusMessage: `unsupported content encoding: ${encoding}`,
        });
    }

    try {
        return new DecompressionStream(format as 'gzip' | 'deflate' | 'deflate-raw');
    } catch {
        throw createError({
            statusCode: 415,
            statusMessage: `content encoding "${encoding}" is not supported by this runtime`,
        });
    }
}
