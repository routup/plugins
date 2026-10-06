import { HeaderName, defineCoreHandler } from 'routup';
import { setRequestRateLimitInfo } from './request';
import type { OptionsInput } from './type';
import { normalizeHandlerOptions } from './utils';

export function createHandler(input?: OptionsInput) {
    const options = normalizeHandlerOptions({ ...(input || {}) });

    if (typeof options.store.init === 'function') {
        options.store.init(options);
    }

    return defineCoreHandler(async (event) => {
        const skip = await options.skip(event);
        if (skip) {
            return event.next();
        }

        const key = await options.keyGenerator(event);

        const { totalHits, resetTime } = await options.store.increment(key);

        const retrieveQuota = typeof options.max === 'function' ?
            options.max(event) :
            options.max;

        const maxHits = await retrieveQuota;

        setRequestRateLimitInfo(event, {
            limit: maxHits,
            current: totalHits,
            remaining: Math.max(maxHits - totalHits, 0),
            resetTime,
        });

        event.response.headers.set(HeaderName.RATE_LIMIT_LIMIT, String(maxHits));
        event.response.headers.set(
            HeaderName.RATE_LIMIT_REMAINING,
            String(Math.max(maxHits - totalHits, 0)),
        );

        if (resetTime) {
            const deltaSeconds = Math.ceil(
                (resetTime.getTime() - Date.now()) / 1000,
            );
            event.response.headers.set(HeaderName.RATE_LIMIT_RESET, String(Math.max(0, deltaSeconds)));
        }

        if (
            maxHits &&
            totalHits > maxHits
        ) {
            event.response.headers.set(
                HeaderName.RETRY_AFTER,
                String(Math.ceil(options.windowMs / 1000)),
            );

            return options.handler(event, options);
        }

        const response = await event.next();

        if (
            options.skipFailedRequest ||
            options.skipSuccessfulRequest
        ) {
            // a downstream throw no error handler answered reaches this
            // handler as no response at all, so it cannot be judged
            const wasSuccessful = response ?
                options.requestWasSuccessful(event, response) :
                false;

            if (
                (options.skipFailedRequest && !wasSuccessful) ||
                (options.skipSuccessfulRequest && wasSuccessful)
            ) {
                await options.store.decrement(key);

                const remaining = Math.max(maxHits - totalHits + 1, 0);
                setRequestRateLimitInfo(event, 'current', totalHits - 1);
                setRequestRateLimitInfo(event, 'remaining', remaining);

                const value = String(remaining);
                event.response.headers.set(HeaderName.RATE_LIMIT_REMAINING, value);

                if (!response) {
                    return response;
                }

                try {
                    response.headers.set(HeaderName.RATE_LIMIT_REMAINING, value);
                    return response;
                } catch {
                    // the headers of a forwarded fetch() response are immutable
                    const headers = new Headers(response.headers);
                    headers.set(HeaderName.RATE_LIMIT_REMAINING, value);

                    return new Response(response.body, {
                        status: response.status,
                        statusText: response.statusText,
                        headers,
                    });
                }
            }
        }

        return response;
    });
}
