import fs from 'node:fs';
import path from 'node:path';
import type { FileInfo, Options } from '../types';
import { isRegexMatch } from './regex';

function generatePathForExtensions(
    requestPath: string,
    extensions: string[],
) : string[] {
    const items = [];

    for (const extension of extensions) {
        items.push(
            requestPath +
            (extension.startsWith('.') ? extension : `.${extension}`),
        );
    }

    return items;
}

function withLeadingSlash(input: string) {
    if (
        input.length > 0 &&
        !input.startsWith('/')
    ) {
        return `/${input}`;
    }

    return input;
}

function isInsideDirectory(filePath: string, directoryPath: string) : boolean {
    const relative = path.relative(directoryPath, filePath);

    return relative !== '..' &&
        !relative.startsWith(`..${path.sep}`) &&
        !path.isAbsolute(relative);
}

const lookupPath = async (
    requestPath: string,
    options: Options,
    stack?: Record<string, FileInfo>,
) : Promise<FileInfo | undefined> => {
    const relativeFilePaths : string[] = [];

    const parts = requestPath
        .split('/')
        .filter((el) => el.length > 0);

    const basePaths : string[] = [];

    // no file
    while (parts.length > 0) {
        const next = parts.join('/');

        if (next.length > 0) {
            basePaths.push(withLeadingSlash(next));
        }

        parts.shift();
    }

    if (basePaths.length === 0) {
        relativeFilePaths.push(...generatePathForExtensions('/index', options.extensions));
    } else {
        for (const basePath of basePaths) {
            if (basePath.endsWith('/')) {
                relativeFilePaths.push(...generatePathForExtensions(`${basePath}index`, options.extensions));
            } else {
                relativeFilePaths.push(basePath);
                relativeFilePaths.push(...generatePathForExtensions(basePath, options.extensions));
                relativeFilePaths.push(...generatePathForExtensions(`${basePath}/index`, options.extensions));
            }
        }
    }

    if (
        options.scan &&
        stack
    ) {
        for (const relativeFilePath of relativeFilePaths) {
            if (typeof stack[relativeFilePath] !== 'undefined') {
                return stack[relativeFilePath];
            }
        }
    } else {
        let filePath : string;

        for (const relativeFilePath of relativeFilePaths) {
            filePath = path.join(options.directoryPath, relativeFilePath);

            if (!isInsideDirectory(filePath, options.directoryPath)) {
                continue;
            }

            try {
                const stats = await fs.promises.stat(filePath);

                if (stats.isFile()) {
                    return {
                        stats,
                        filePath,
                    };
                }
            } catch {
                // do nothing :)
            }
        }
    }

    return undefined;
};

export async function lookup(
    requestPath: string,
    options: Options,
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
