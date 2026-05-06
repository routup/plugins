import type { Formatter, TokenMap } from './types';

type Piece =    | { type: 'literal'; value: string } |
    {
        type: 'token'; 
        name: string; 
        arg?: string 
    };

const TOKEN_RE = /:([-\w]{2,})(?:\[([^\]]+)\])?/g;

function parse(format: string): Piece[] {
    const pieces: Piece[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    TOKEN_RE.lastIndex = 0;
    while ((match = TOKEN_RE.exec(format)) !== null) {
        if (match.index > lastIndex) {
            pieces.push({ type: 'literal', value: format.slice(lastIndex, match.index) });
        }
        pieces.push({
            type: 'token',
            name: match[1] as string,
            arg: match[2],
        });
        lastIndex = TOKEN_RE.lastIndex;
    }

    if (lastIndex < format.length) {
        pieces.push({ type: 'literal', value: format.slice(lastIndex) });
    }

    return pieces;
}

export function compile(format: string): Formatter {
    if (typeof format !== 'string') {
        throw new TypeError('argument format must be a string');
    }

    const pieces = parse(format);

    return (tokens: TokenMap, event, response) => {
        let out = '';
        for (const piece of pieces) {
            if (piece.type === 'literal') {
                out += piece.value;
                continue;
            }

            const token = tokens[piece.name];
            const value = token ?
                token(event, response, piece.arg) :
                undefined;
            out += value ?? '-';
        }

        return out;
    };
}
