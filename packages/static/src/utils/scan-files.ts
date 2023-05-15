import type { FileInfo, HandlerOptions } from '../type';
import { readDirectory } from './directory';
import { isRegexMatch } from './regex';

export function scanFiles(
    stack: Record<string, FileInfo>,
    options: HandlerOptions,
) {
    if (!options.scan) {
        return;
    }

    readDirectory(options.directoryPath, (relativePath, filePath, stats) => {
        if (
            !(/\.well-known[\\+/]/.test(relativePath)) &&
            !options.dotFiles &&
            /(^\.|[\\+|/+]\.)/.test(relativePath)
        ) {
            return;
        }

        if (
            options.ignores.length > 0 &&
            isRegexMatch(relativePath, options.ignores)
        ) {
            return;
        }

        const key = `/${relativePath.normalize().replace(/\\+/g, '/')}`;

        stack[key] = {
            filePath,
            stats,
        };
    });
}
