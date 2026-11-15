import { randomUUID } from 'node:crypto';

const UNSAFE_JSON_CHARS = /[<>&\u2028\u2029]/g;

const FUNCTION_EXPRESSION_RE = /^(?:async\s*)?(?:function\b|\(|[\w$]+\s*=>)/;

/**
 * Turn a function into source that is valid as an expression,
 * including method shorthand (`foo() {}`, `async foo() {}`).
 */
function toFunctionSource(fn: CallableFunction) : string {
    const source = fn.toString();

    if (FUNCTION_EXPRESSION_RE.test(source) || source.startsWith('class')) {
        return source;
    }

    if (source.startsWith('async ')) {
        return `async function ${source.substring(6)}`;
    }

    return `function ${source}`;
}

/**
 * Serialize options to a JavaScript expression.
 *
 * JSON values have `<`, `>`, `&`, U+2028 and U+2029 escaped, so the
 * output cannot close a surrounding element or comment, wherever it is
 * inlined. Function values are emitted as their source.
 */
export function serializeOptions(input: Record<string, any>) : string {
    const token = `__routup_fn_${randomUUID().replace(/-/g, '')}_`;
    const fns : string[] = [];

    const json = JSON.stringify(input, (key, value) => {
        if (typeof value === 'function') {
            const source = toFunctionSource(value);

            if (source.includes('[native code]')) {
                throw new Error(
                    `The swagger-ui option ${JSON.stringify(key)} is a bound or native function, ` +
                    'which cannot be serialized. Pass a plain function instead.',
                );
            }

            fns.push(source);

            return `${token}${fns.length - 1}`;
        }

        return value;
    }, 2) ?? '{}';

    return json
        .replace(UNSAFE_JSON_CHARS, (char) => `\\u${char.charCodeAt(0).toString(16).padStart(4, '0')}`)
        .replace(new RegExp(`"${token}(\\d+)"`, 'g'), (_match, index) => `(${fns[Number(index)]})`);
}

export function escapeHTML(input: string) : string {
    return input
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
