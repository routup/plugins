import type { Handler } from 'routup';
import type { RequestListener } from 'http';

export function createMiddleware(handler: Handler) : RequestListener {
    return (req, res) => {
        handler(req, res, () => {
            res.end();
        });
    };
}
