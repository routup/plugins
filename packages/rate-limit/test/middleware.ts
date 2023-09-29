import type { CoreHandlerFn, HandlerFn } from 'routup';
import type { RequestListener } from 'http';

export function createMiddleware(handler: CoreHandlerFn) : RequestListener {
    return (req, res) => {
        handler(req, res, () => {
            res.end();
        });
    };
}
