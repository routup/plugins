/*
 * Copyright (c) 2022.
 * Author Peter Placzek (tada5hi)
 * For the full copyright and license information,
 * view the LICENSE file that was distributed with this source code.
 */

import { IncomingMessage } from 'http';
import { getMimeType } from '../../utils';
import { getRequestHeader } from './header';
import { useRequestNegotiator } from './negotiator';

export function useRequestAccepts(req: IncomingMessage) : string[];
export function useRequestAccepts(req: IncomingMessage, input: string) : string | undefined;
export function useRequestAccepts(req: IncomingMessage, input: string[]) : string | undefined;
export function useRequestAccepts(req: IncomingMessage, ...input: string[]) : string | undefined;
export function useRequestAccepts(req: IncomingMessage, input?: string | string[]) : string | string[] | undefined {
    input = input || [];
    const items = Array.isArray(input) ? input : [input];

    const negotiator = useRequestNegotiator(req);

    if (items.length === 0) {
        return negotiator.mediaTypes();
    }

    const header = getRequestHeader(req, 'accept');
    if (!header) {
        return items[0];
    }

    let polluted = false;
    const mimeTypes : string[] = [];
    for (let i = 0; i < items.length; i++) {
        const mimeType = getMimeType(items[i]);
        if (mimeType) {
            mimeTypes.push(mimeType);
        } else {
            polluted = true;
        }
    }

    const matches = negotiator.mediaTypes(mimeTypes);
    if (matches.length > 0) {
        if (polluted) {
            return items[0];
        }

        return items[mimeTypes.indexOf(matches[0])];
    }

    return undefined;
}