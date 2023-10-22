import fs from 'node:fs';
import type { CoreHandlerFn, Handler } from 'routup';
import {
    HeaderName,
    coreHandler,
    sendFile,
    useRequestMountPath,
    useRequestPath,
} from 'routup';
import type { FileInfo, OptionsInput } from './type';
import { buildOptions, scanFiles } from './utils';
import { lookup } from './utils/lookup';

export function createHandler(directory: string, input?: OptionsInput) : Handler {
    return coreHandler(createHandlerFn(directory, input));
}
export function createHandlerFn(directory: string, input?: OptionsInput) : CoreHandlerFn {
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

    return (req, res, next) => {
        let requestPath = useRequestPath(req);

        const mountPath = useRequestMountPath(req);
        if (requestPath.startsWith(mountPath)) {
            requestPath = requestPath.substring(mountPath.length);
        }

        if (!requestPath.startsWith('/')) {
            requestPath = `/${requestPath}`;
        }

        if (requestPath.indexOf('%') !== -1) {
            try {
                requestPath = decodeURI(requestPath);
            } catch (err) {
                // do nothing :)
            }
        }

        lookup(requestPath, options, stack)
            .then((fileInfo) => {
                if (typeof fileInfo === 'undefined') {
                    if (
                        options.fallthrough &&
                        typeof next !== 'undefined'
                    ) {
                        next();
                    } else {
                        res.statusCode = 404;
                        res.end();
                    }

                    return Promise.resolve();
                }

                if (cacheControl) {
                    res.setHeader(HeaderName.CACHE_CONTROL, cacheControl);
                }

                if (
                    req.headers[HeaderName.IF_NONE_MATCH] === `W/"${fileInfo.stats.size}-${fileInfo.stats.mtime.getTime()}"`
                ) {
                    res.writeHead(304);
                    res.end();
                    return Promise.resolve();
                }

                return sendFile(res, {
                    content: (options) => fs.createReadStream(fileInfo.filePath, options),
                    stats: () => fileInfo.stats,
                    name: fileInfo.filePath,
                }, (err?: Error) => {
                    if (err) {
                        if (
                            options.fallthrough &&
                            typeof next === 'function'
                        ) {
                            return next(err);
                        }

                        res.statusCode = 404;
                    }

                    res.end();

                    return Promise.resolve();
                });
            });
    };
}
