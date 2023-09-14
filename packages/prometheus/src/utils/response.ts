import type { Response } from 'routup';

export function onResponseFinished(
    res: Response,
    cb: (err?: Error) => void,
) {
    let called : boolean;

    const callCallback = (err?: Error) => {
        if (called) return;

        called = true;

        cb(err);
    };

    res.on('finish', () => {
        callCallback();
    });

    res.on('close', () => {
        callCallback();
    });

    res.on('error', (err) => {
        callCallback(err);
    });
}
