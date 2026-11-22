import type { IAppEvent } from 'routup';
import { HeaderName, defineCoreHandler } from 'routup';
import { setRequestRateLimitInfo } from './request';
import type { IncrementResponse, Options, OptionsInput } from './types';
import { normalizeHandlerOptions } from './utils';

/**
 * Store the rate limit info of the request and set the rate-limit
 * headers of event.response; returns the headers that were set.
 */
function applyRateLimitState(
    event: IAppEvent,
    limit: number,
    current: number,
    resetTime: Date | undefined,
) : Record<string, string> {
    const remaining = Math.max(limit - current, 0);

    setRequestRateLimitInfo(event, {
        limit,
        current,
        remaining,
        resetTime,
    });

    const headers : Record<string, string> = {
        [HeaderName.RATE_LIMIT_LIMIT]: String(limit),
        [HeaderName.RATE_LIMIT_REMAINING]: String(remaining),
    };

    if (resetTime) {
        const deltaSeconds = Math.ceil(
            (resetTime.getTime() - Date.now()) / 1000,
        );

        headers[HeaderName.RATE_LIMIT_RESET] = String(Math.max(0, deltaSeconds));
    }

    const keys = Object.keys(headers);

    for (const key of keys) {
        event.response.headers.set(key, headers[key]!);
    }

    return headers;
}

/**
 * Set headers on a response the next handler returned.
 */
function setResponseHeaders(
    response: Response | undefined,
    headers: Record<string, string>,
) : Response | undefined {
    if (!response) {
        return response;
    }

    const keys = Object.keys(headers);

    try {
        for (const key of keys) {
            response.headers.set(key, headers[key]!);
        }

        return response;
    } catch {
        // the headers of a forwarded fetch() response are immutable
        const copy = new Headers(response.headers);

        for (const key of keys) {
            copy.set(key, headers[key]!);
        }

        return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: copy,
        });
    }
}

/**
 * Decide whether a response counts towards the quota.
 */
function isResponseCounted(
    options: Options,
    event: IAppEvent,
    response: Response | undefined,
) : boolean {
    if (
        !options.skipFailedRequest &&
        !options.skipSuccessfulRequest
    ) {
        return true;
    }

    // a downstream throw no error handler answered reaches this
    // handler as no response at all, so it cannot be judged
    const wasSuccessful = response ?
        options.requestWasSuccessful(event, response) :
        false;

    return !(
        (options.skipFailedRequest && !wasSuccessful) ||
        (options.skipSuccessfulRequest && wasSuccessful)
    );
}

export function createHandler(input?: OptionsInput) {
    const options = normalizeHandlerOptions({ ...(input || {}) });

    if (
        options.countAfterResponse &&
        typeof options.store.get !== 'function'
    ) {
        throw new Error('The countAfterResponse option requires a store with a get() method.');
    }

    if (typeof options.store.init === 'function') {
        options.store.init(options);
    }

    return defineCoreHandler(async (event) => {
        const skip = await options.skip(event);

        if (skip) {
            return event.next();
        }

        const key = await options.keyGenerator(event);

        // count-after-response reads the hits so far, the default
        // reserves a slot for this request before forwarding it
        let record : IncrementResponse | undefined;

        if (options.countAfterResponse) {
            record = await options.store.get!(key);
        } else {
            record = await options.store.increment(key);
        }

        const totalHits = record?.totalHits ?? 0;

        const retrieveQuota = typeof options.max === 'function' ?
            options.max(event) :
            options.max;

        const maxHits = await retrieveQuota;

        applyRateLimitState(event, maxHits, totalHits, record?.resetTime);

        const exceeded = options.countAfterResponse ?
            totalHits >= maxHits :
            totalHits > maxHits;

        if (maxHits && exceeded) {
            event.response.headers.set(
                HeaderName.RETRY_AFTER,
                String(Math.ceil(options.windowMs / 1000)),
            );

            return options.handler(event, options);
        }

        const response = await event.next();

        const counted = isResponseCounted(options, event, response);

        if (options.countAfterResponse) {
            if (!counted) {
                return response;
            }

            const next = await options.store.increment(key);

            const headers = applyRateLimitState(event, maxHits, next.totalHits, next.resetTime);

            delete headers[HeaderName.RATE_LIMIT_LIMIT];

            return setResponseHeaders(response, headers);
        }

        if (counted) {
            return response;
        }

        await options.store.decrement(key, record?.window);

        const headers = applyRateLimitState(event, maxHits, totalHits - 1, record?.resetTime);

        return setResponseHeaders(response, { [HeaderName.RATE_LIMIT_REMAINING]: headers[HeaderName.RATE_LIMIT_REMAINING]! });
    });
}
