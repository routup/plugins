import fs from 'node:fs';
import path from 'node:path';
import type { FileInfo, Options } from '../type';
import { isRegexMatch } from './regex';

function generatePathForExtensions(
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

function withLeadingSlash(input: string) {
    if (
        input.length > 0 &&
        !input.startsWith('/')
    ) {
        return `/${input}`;
    }

    return input;
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
        for (let i = 0; i < basePaths.length; i++) {
            const basePath = basePaths[i];
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
