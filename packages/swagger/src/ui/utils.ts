import { URL, pathToFileURL } from 'node:url';

export function isFileURL(input: string) : boolean {
    let url: URL;

    try {
        url = new URL(input);
    } catch (e) {
        url = pathToFileURL(input);
    }

    return url.protocol === 'file:';
}
