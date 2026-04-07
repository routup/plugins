import fs from 'node:fs';
import { Readable } from 'node:stream';
import type { CoreHandler, Handler } from 'routup';
import {
    HeaderName,
    defineCoreHandler,
    sendFile,
} from 'routup';
import type { FileInfo, OptionsInput } from './type';
import { buildOptions, scanFiles } from './utils';
import { lookup } from './utils/lookup';

export function createHandler(directory: string, input?: OptionsInput) : Handler {
    return defineCoreHandler(createHandlerFn(directory, input));
}
export function createHandlerFn(directory: string, input?: OptionsInput) : CoreHandler {
    const options = buildOptions({
        ...(input || {}),
        directoryPath: directory,
    });

    let cacheControl : string | undefined;
    if (typeof options.cacheMaxAge !== 'undefined') {
        cacheControl = `public,max-age=${options.cacheMaxAge}`;

        if (options.cacheImmutable) {
            cacheControl += ',immutable';
        } else if (options.cacheMaxAge === 0) {
            cacheControl += ',must-revalidate';
        }
    }

    const stack : Record<string, FileInfo> = {};

    scanFiles(stack, options);

    return async (event) => {
        let requestPath = event.path;

        const { mountPath } = event;
        if (requestPath.startsWith(mountPath)) {
            requestPath = requestPath.substring(mountPath.length);
        }

        if (!requestPath.startsWith('/')) {
            requestPath = `/${requestPath}`;
        }

        if (requestPath.includes('%')) {
            try {
                requestPath = decodeURI(requestPath);
            } catch {
                // do nothing :)
            }
        }

        const fileInfo = await lookup(requestPath, options, stack);

        if (typeof fileInfo === 'undefined') {
            if (options.fallthrough) {
                return event.next();
            }

            event.response.status = 404;
            return null;
        }

        if (cacheControl) {
            event.response.headers.set(HeaderName.CACHE_CONTROL, cacheControl);
        }

        if (
            event.headers.get(HeaderName.IF_NONE_MATCH) === `W/"${fileInfo.stats.size}-${fileInfo.stats.mtime.getTime()}"`
        ) {
            event.response.status = 304;
            return null;
        }

        try {
            return await sendFile(event, {
                content: (opts) => Readable.toWeb(fs.createReadStream(fileInfo.filePath, opts)) as ReadableStream,
                stats: () => fileInfo.stats,
                name: fileInfo.filePath,
            });
        } catch {
            if (options.fallthrough) {
                return event.next();
            }

            event.response.status = 404;
            return null;
        }
    };
}
