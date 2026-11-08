import type { FileInfo, Options } from '../types';
import { readDirectory } from './directory';
import { isRegexMatch } from './regex';

export async function scanFiles(
    stack: Record<string, FileInfo>,
    options: Options,
) : Promise<void> {
    if (!options.scan) {
        return;
    }

    await readDirectory(options.directoryPath, (relativePath, filePath, stats) => {
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
