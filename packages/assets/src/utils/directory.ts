import fs from 'node:fs';
import path from 'node:path';
import type { ReadDirectoryCallback } from '../type';

export function readDirectory(
    dir: string,
    callback: ReadDirectoryCallback,
    prefix = '',
) {
    dir = path.resolve('.', dir);

    let abs : string;
    let stats : fs.Stats;

    fs.promises.readdir(dir)
        .then((arr) => {
            for (const element of arr) {
                abs = path.join(dir, element);
                stats = fs.statSync(abs);

                if (stats.isDirectory()) {
                    readDirectory(abs, callback, path.join(prefix, element));
                } else {
                    callback(path.join(prefix, element), abs, stats);
                }
            }
        });
}
