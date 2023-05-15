import path from 'node:path';

export function getAssetsPath() {
    return path.resolve(__dirname, '..', 'assets');
}
