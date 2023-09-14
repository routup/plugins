import fs from 'node:fs';
import path from 'node:path';
import type { FileInfo, HandlerOptions } from '../type';
import { isRegexMatch } from './regex';

function generatePaths(
    requestPath: string,
    extensions: string[],
) : string[] {
    const items = [];

    for (let i = 0; i < extensions.length; i++) {
        items.push(
            requestPath +
            (extensions[i].startsWith('.') ? extensions[i] : `.${extensions[i]}`),
        );
    }

    return items;
}

const lookupPath = async (
    requestPath: string,
    options: HandlerOptions,
    stack?: Record<string, FileInfo>,
) : Promise<FileInfo | undefined> => {
    const relativeFilePaths : string[] = [];

    if (!requestPath.endsWith('/')) {
        relativeFilePaths.push(requestPath);
    }

    if (options.extensions.length > 0) {
        if (requestPath.endsWith('/')) {
            relativeFilePaths.push(...generatePaths(`${requestPath}index`, options.extensions));
        } else {
            const baseName = path.basename(requestPath);
            if (baseName.indexOf('.') === -1) {
                relativeFilePaths.push(...generatePaths(requestPath, options.extensions));
                relativeFilePaths.push(...generatePaths(`${requestPath}/index`, options.extensions));
            }
        }
    }

    if (
        options.scan &&
        stack
    ) {
        for (let i = 0; i < relativeFilePaths.length; i++) {
            if (typeof stack[relativeFilePaths[i]] !== 'undefined') {
                return stack[relativeFilePaths[i]];
            }
        }
    } else {
        let filePath : string;
        for (let i = 0; i < relativeFilePaths.length; i++) {
            filePath = path.join(options.directoryPath, relativeFilePaths[i]);

            try {
                const stats = await fs.promises.stat(filePath);
                if (stats.isFile()) {
                    return {
                        stats,
                        filePath,
                    };
                }
            } catch (e) {
                // do nothing :)
            }
        }
    }

    return undefined;
};

export async function lookup(
    requestPath: string,
    options: HandlerOptions,
    stack?: Record<string, FileInfo>,
) : Promise<FileInfo | undefined> {
    let fileInfo : FileInfo | undefined;

    if (
        options.ignores.length === 0 ||
        !isRegexMatch(requestPath, options.ignores)
    ) {
        fileInfo = await lookupPath(requestPath, options, stack);
    }

    if (
        typeof fileInfo === 'undefined' &&
        !!options.fallback &&
        !isRegexMatch(requestPath, options.fallbackIgnores)
    ) {
        fileInfo = await lookupPath(options.fallbackPath, options, stack);
    }

    return fileInfo;
}
