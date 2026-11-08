import fs from 'node:fs';
import path from 'node:path';
import type { ReadDirectoryCallback } from '../type';

export async function readDirectory(
    dir: string,
    callback: ReadDirectoryCallback,
    prefix = '',
) : Promise<void> {
    const directoryPath = path.resolve('.', dir);
    const elements = await fs.promises.readdir(directoryPath);

    for (const element of elements) {
        const filePath = path.join(directoryPath, element);
        const stats = await fs.promises.stat(filePath);

        if (stats.isDirectory()) {
            await readDirectory(filePath, callback, path.join(prefix, element));
        } else {
            callback(path.join(prefix, element), filePath, stats);
        }
    }
}
